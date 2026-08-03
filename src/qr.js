/* ================= 极简二维码生成器(QR Code,零依赖) ================= */
// 支持 Version 1~4、纠错级别 L、字节模式——覆盖游戏 URL 场景(<78 字节)。
// 输出 modules[row][col] 布尔矩阵(黑=true),供分享卡绘制。
// 数据编码流程:比特流 → 填充 → RS 纠错 → 蛇形放置 → 掩码选优 → 格式信息。

/* GF(256):x^8+x^4+x^3+x^2+1 */
const GF = (()=>{
  const exp = new Uint8Array(256), log = new Uint8Array(256);
  let x = 1;
  for(let i=0;i<255;i++){ exp[i]=x; log[x]=i; x <<= 1; if(x & 0x100) x ^= 0x11d; }
  exp[255] = exp[0];
  const mul = (a,b)=> (a&&b) ? exp[(log[a]+log[b])%255] : 0;
  return { exp, mul };
})();

const VERSIONS = [   // v / size / data codewords / ec codewords / 字节容量(V1~4,L 均为单块)
  { v:1, size:21, data:19, ec:7,  cap:17 },
  { v:2, size:25, data:34, ec:10, cap:32 },
  { v:3, size:29, data:55, ec:15, cap:53 },
  { v:4, size:33, data:80, ec:20, cap:78 },
];

function rsGen(ecLen){          // 生成多项式 g(x)=∏(x-α^i)
  let g = [1];
  for(let i=0;i<ecLen;i++){
    const a = GF.exp[i], ng = new Array(g.length+1).fill(0);
    for(let j=0;j<g.length;j++){
      ng[j] ^= GF.mul(g[j], a);
      ng[j+1] ^= g[j];
    }
    g = ng;
  }
  return g;
}
function rsRemainder(data, g){  // data 多项式 ×x^ec 除 g 的余数(纠错码)
  // g 数组下标 i 为 x^i 系数(低次→高次),g[g.length-1] 为最高次(恒 1)
  const ecLen = g.length - 1, rem = new Uint8Array(ecLen);
  for(const b of data){
    const f = b ^ rem[0];
    rem.copyWithin(0, 1); rem[ecLen-1] = 0;
    for(let i=0;i<ecLen;i++) rem[i] ^= GF.mul(g[ecLen-1-i], f);
  }
  return rem;
}

/* 掩码规则表 */
function maskBit(mask, r, c){
  switch(mask){
    case 0: return (r+c)%2 === 0;
    case 1: return r%2 === 0;
    case 2: return c%3 === 0;
    case 3: return (r+c)%3 === 0;
    case 4: return (Math.floor(r/2)+Math.floor(c/3))%2 === 0;
    case 5: return ((r*c)%2 + (r*c)%3) === 0;
    case 6: return (((r*c)%2 + (r*c)%3) % 2) === 0;
    case 7: return (((r+c)%2 + (r*c)%3) % 2) === 0;
  }
  return false;
}

/* 格式信息:ECC 位(01=L) + 掩码 3 位 → BCH(15,5) + 0x5412 */
function formatBits(mask){
  let d = (1 << 3) | mask;
  let rem = d << 10;
  const g = 0x537;
  for(let i=14;i>=10;i--) if(rem & (1 << i)) rem ^= g << (i-10);
  return ((d << 10) | rem) ^ 0x5412;
}

/* 惩罚分:选掩码用(N1 连续同色 / N2 2×2 块 / N3 探针型 / N4 暗色比例) */
function penalty(m){
  const n = m.length, W = n*n;
  let score = 0;
  const runs = (arr)=>{
    let len = 1;
    for(let i=1;i<=arr.length;i++){
      if(i < arr.length && arr[i] === arr[i-1]) len++;
      else { if(len >= 5) score += 3 + (len-5); len = 1; }
    }
  };
  for(let r=0;r<n;r++) runs(m[r]);
  for(let c=0;c<n;c++){ const col = m.map(row=>row[c]); runs(col); }
  for(let r=0;r<n-1;r++) for(let c=0;c<n-1;c++){
    if(m[r][c]===m[r][c+1] && m[r][c]===m[r+1][c] && m[r][c]===m[r+1][c+1]) score += 3;
  }
  // N3 探针型图案:11 位窗口重叠扫描(00001011101 / 10111010000)
  const probe = (s)=>{
    let k = 0;
    for(let i=0;i+11<=s.length;i++){
      const w = s.substr(i, 11);
      if(w === '00001011101' || w === '10111010000') k++;
    }
    return k;
  };
  for(const row of m) score += probe(row.map(b=>b?'1':'0').join('')) * 40;
  for(let c=0;c<n;c++) score += probe(m.map(r=>r[c]?'1':'0').join('')) * 40;
  let dark = 0;
  for(const row of m) for(const b of row) if(b) dark++;
  score += Math.floor(Math.abs(dark/W*100 - 50) / 5) * 10;
  return score;
}

export function makeQR(text, forceMask){
  const bytes = new TextEncoder().encode(text);
  const V = VERSIONS.find(v => bytes.length <= v.cap);
  if(!V) return null;   // URL 过长,放弃画码(分享卡仍保留链接文字)
  const n = V.size;

  // 1. 比特流:模式(字节 0100)+ 长度(8bit)+ 数据 + 终止 + 填充
  const bits = [];
  const push = (val, len)=>{ for(let i=len-1;i>=0;i--) bits.push((val >> i) & 1); };
  push(0b0100, 4); push(bytes.length, 8);
  for(const b of bytes) push(b, 8);
  push(0, Math.min(4, 8 - bits.length % 8));
  while(bits.length % 8) bits.push(0);
  let pad = 0xEC;
  while(bits.length < V.data*8){
    for(let i=7;i>=0;i--) bits.push((pad >> i) & 1);
    pad = pad === 0xEC ? 0x11 : 0xEC;
  }
  const data = new Uint8Array(V.data);
  for(let i=0;i<V.data;i++){
    let b = 0; for(let j=0;j<8;j++) b = (b<<1) | bits[i*8+j];
    data[i] = b;
  }
  const ec = rsRemainder(data, rsGen(V.ec));
  const allBits = [];
  for(const b of data) pushBits(allBits, b);
  for(const b of ec) pushBits(allBits, b);
  function pushBits(arr, val){ for(let i=7;i>=0;i--) arr.push((val>>i)&1); }

  // 2. 功能图案
  const m = Array.from({length:n},()=>new Array(n).fill(false));
  const func = Array.from({length:n},()=>new Array(n).fill(false));
  const drawFinder = (r,c)=>{
    for(let i=0;i<7;i++) for(let j=0;j<7;j++)
      m[r+i][c+j] = i===0||i===6||j===0||j===6 || (i>=2&&i<=4&&j>=2&&j<=4);
    for(let i=-1;i<=7;i++) for(let j=-1;j<=7;j++){
      const rr=r+i, cc=c+j;
      if(rr>=0&&rr<n&&cc>=0&&cc<n) func[rr][cc]=true;
    }
  };
  drawFinder(0,0); drawFinder(0,n-7); drawFinder(n-7,0);
  for(let i=8;i<n-8;i++){ m[6][i] = i%2===0; m[i][6] = i%2===0; func[6][i]=true; func[i][6]=true; }
  if(V.v >= 2){                     // 对齐图案(V2~4 各 1 个)
    const ac = n-7;
    for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){
      m[ac+i][ac+j] = Math.abs(i)===2||Math.abs(j)===2 || (i===0&&j===0);
      func[ac+i][ac+j] = true;
    }
  }
  m[n-8][8] = true; func[n-8][8] = true;        // dark module
  for(let i=0;i<=8;i++){                        // 格式信息占位(两处)
    if(i !== 6){ func[8][i]=true; func[i][8]=true; }
  }
  for(let i=0;i<8;i++){ func[8][n-1-i]=true; func[n-1-i][8]=true; }

  // 3. 蛇形放置数据码(功能图案区域跳过,不消费数据位)
  const place = (arr)=>{
    let row = n-1, col = n-1, dir = -1, bi = 0;
    while(col > 0){
      if(col === 6) col--;
      for(;;){
        for(let k=0;k<2;k++){
          const c = col - k;
          if(!func[row][c]){ m[row][c] = bi < arr.length && arr[bi] === 1; bi++; }
        }
        row += dir;
        if(row < 0 || row >= n){ dir = -dir; row += dir; break; }
      }
      col -= 2;
    }
  };
  place(allBits);

  // 4. 掩码选优(对数据区应用 + 填格式信息后算惩罚)
  // 格式信息位置(bit0..14,LSB 先放):副本1 围左上 finder,副本2 在右上/左下
  const fmtPosA = [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]];
  const fmtPosB = [[8,n-1],[8,n-2],[8,n-3],[8,n-4],[8,n-5],[8,n-6],[8,n-7],[8,n-8],[n-7,8],[n-6,8],[n-5,8],[n-4,8],[n-3,8],[n-2,8],[n-1,8]];
  const applyFmt = (mm, bits)=>{
    for(let i=0;i<15;i++){   // 格式信息按 LSB 先放(bit0 在 (8,0))
      mm[fmtPosA[i][0]][fmtPosA[i][1]] = ((bits >> i) & 1) === 1;
      mm[fmtPosB[i][0]][fmtPosB[i][1]] = ((bits >> i) & 1) === 1;
    }
  };
  let bestMask = forceMask ?? 0, bestPen = Infinity;
  for(let mask=0;mask<8;mask++){
    const cm = m.map(row=>row.slice());
    cm[n-8][8] = false;   // 与 python 一致:选掩码时 dark module 视为白色(最终仍填黑)
    for(let r=0;r<n;r++) for(let c=0;c<n;c++)
      if(!func[r][c] && maskBit(mask,r,c)) cm[r][c] = !cm[r][c];
    // 与 python qrcode 一致:惩罚在格式信息未填入(test 模式)的矩阵上计算
    const p = penalty(cm);
    if(p < bestPen && forceMask === undefined){ bestPen = p; bestMask = mask; }
  }
  for(let r=0;r<n;r++) for(let c=0;c<n;c++)
    if(!func[r][c] && maskBit(bestMask,r,c)) m[r][c] = !m[r][c];
  applyFmt(m, formatBits(bestMask));
  return m;
}

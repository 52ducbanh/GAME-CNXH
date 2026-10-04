import fs from 'fs';

const path = 'server/src/gameEngine.ts';
let code = fs.readFileSync(path, 'utf8');

const targetGetters = '  public get hatinhState(){return this.province.projection().hatinhState;}';
const replacementGetters = `  public get hatinhState(){return this.province.projection().hatinhState;}
  public get ninhBinhState(){return this.province.projection().ninhBinhState;}
  public get quangNinhState(){return this.province.projection().quangNinhState;}
  public get haiPhongState(){return this.province.projection().haiPhongState;}
  public get thanhHoaState(){return this.province.projection().thanhHoaState;}
  public get ngheAnState(){return this.province.projection().ngheAnState;}`;

if (code.includes(targetGetters)) {
  code = code.replace(targetGetters, replacementGetters);
  console.log('Replaced getters successfully');
} else {
  console.log('Target getters not found');
}

const targetSnapshot = '      hatinhState: projection.hatinhState\n    };';
const replacementSnapshot = `      hatinhState: projection.hatinhState,
      ninhBinhState: projection.ninhBinhState,
      quangNinhState: projection.quangNinhState,
      haiPhongState: projection.haiPhongState,
      thanhHoaState: projection.thanhHoaState,
      ngheAnState: projection.ngheAnState
    };`;

if (code.includes(targetSnapshot)) {
  code = code.replace(targetSnapshot, replacementSnapshot);
  console.log('Replaced snapshot successfully');
} else {
  console.log('Target snapshot not found, trying CRLF');
  const targetSnapshotCRLF = '      hatinhState: projection.hatinhState\r\n    };';
  const replacementSnapshotCRLF = `      hatinhState: projection.hatinhState,\r
      ninhBinhState: projection.ninhBinhState,\r
      quangNinhState: projection.quangNinhState,\r
      haiPhongState: projection.haiPhongState,\r
      thanhHoaState: projection.thanhHoaState,\r
      ngheAnState: projection.ngheAnState\r
    };`;
  if (code.includes(targetSnapshotCRLF)) {
    code = code.replace(targetSnapshotCRLF, replacementSnapshotCRLF);
    console.log('Replaced snapshot CRLF successfully');
  }
}

fs.writeFileSync(path, code, 'utf8');

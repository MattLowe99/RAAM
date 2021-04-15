export type Direction = 'front' | 'back' | 'left' | 'right';
export type UserLocation = {
  x: number;
  y: number;
  rotation: Direction;
  moving: boolean;
};

enum MapSelection {
  Standard,
  Conference,
  Classroom,
  Party,
}

enum SpriteRestriction {
  allUsers,
  passwordUsers,
  noUsers,
}
export type CoveyTownList = { friendlyName: string; coveyTownID: string; currentOccupancy: number; maximumOccupancy: number, mapID: MapSelection, enableVideo: boolean, enableProximity: boolean, spriteRestriction: SpriteRestriction, restrictedSpriteName: string }[];


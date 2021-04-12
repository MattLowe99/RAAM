export default class Player {
  public location?: UserLocation;

  public readonly _avatar: string;

  private readonly _id: string;

  private readonly _userName: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  private readonly defaultAvatar = 'misa';

  constructor(id: string, userName: string, location: UserLocation, avatar?: string) {
    this._id = id;
    this._userName = userName;
    this.location = location;
    this._avatar = avatar || this.defaultAvatar;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  get avatar(): string {
    return this._avatar;
  }

  static fromServerPlayer(playerFromServer: ServerPlayer): Player {
    return new Player(playerFromServer._id, playerFromServer._userName, playerFromServer.location, playerFromServer._avatar);
  }
}
export type ServerPlayer = { _id: string, _userName: string, location: UserLocation, _avatar: string };

export type Direction = 'front'|'back'|'left'|'right';

export type UserLocation = {
  x: number,
  y: number,
  rotation: Direction,
  moving: boolean
};

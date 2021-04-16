import { Socket } from 'socket.io-client';
import Player, { UserLocation } from './classes/Player';
import TownsServiceClient from './classes/TownsServiceClient';

export type CoveyEvent = 'playerMoved' | 'playerAdded' | 'playerRemoved';

export type VideoRoom = {
  twilioID: string,
  id: string
};
export type UserProfile = {
  displayName: string,
  id: string
};
export type NearbyPlayers = {
  nearbyPlayers: Player[]
};
export type CoveyAppState = {
  sessionToken: string,
  userName: string,
  currentTownFriendlyName: string,
  currentTownID: string,
  currentTownIsPubliclyListed: boolean,
  myPlayerID: string,
  mapID: MapSelection,
  enableVideo: boolean,
  enableProximity: boolean,
  spriteRestriction: SpriteRestriction,
  restrictedSpriteName: string,
  players: Player[],
  currentLocation: UserLocation,
  nearbyPlayers: NearbyPlayers,
  emitMovement: (location: UserLocation) => void,
  socket: Socket | null,
  apiClient: TownsServiceClient,
};

export enum MapSelection {
  Standard,
  Conference,
  Classroom,
  Party
}

export enum AvatarSelection {
  Misa,
  Bido,
  Nina,
  Lilo,
  Coco,
  Riko,
  Domo,
  Jiji,
  Dede,
  Kimi
}

export enum SpriteRestriction {
  allUsers,
  passwordUsers,
  noUsers,
}

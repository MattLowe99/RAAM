import { nanoid } from 'nanoid';
import CoveyTownsStore from './CoveyTownsStore';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import { MapSelection } from '../client/TownsServiceClient';

const mockCoveyListenerTownDestroyed = jest.fn();
const mockCoveyListenerOtherFns = jest.fn();

function mockCoveyListener(): CoveyTownListener {
  return {
    onPlayerDisconnected(removedPlayer: Player): void {
      mockCoveyListenerOtherFns(removedPlayer);
    },
    onPlayerMoved(movedPlayer: Player): void {
      mockCoveyListenerOtherFns(movedPlayer);
    },
    onTownDestroyed() {
      mockCoveyListenerTownDestroyed();
    },
    onPlayerJoined(newPlayer: Player) {
      mockCoveyListenerOtherFns(newPlayer);
    },
  };
}

function createTownForTesting( mapID: MapSelection, enableVideo: boolean, enableProximity: boolean, friendlyNameToUse?: string, isPublic = false) {
  const friendlyName = friendlyNameToUse !== undefined ? friendlyNameToUse :
    `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
  return CoveyTownsStore.getInstance()
    .createTown(friendlyName, isPublic, mapID, enableVideo, enableProximity);
}

describe('CoveyTownsStore', () => {
  beforeEach(() => {
    mockCoveyListenerTownDestroyed.mockClear();
    mockCoveyListenerOtherFns.mockClear();
  });
  it('should be a singleton', () => {
    const store1 = CoveyTownsStore.getInstance();
    const store2 = CoveyTownsStore.getInstance();
    expect(store1)
      .toBe(store2);
  });

  describe('createTown', () => {
    it('Should allow multiple towns with the same friendlyName', () => {
      const firstTown = createTownForTesting(MapSelection.Standard, true, true);
      const secondTown = createTownForTesting( MapSelection.Standard, true, true, firstTown.friendlyName);
      expect(firstTown)
        .not
        .toBe(secondTown);
      expect(firstTown.friendlyName)
        .toBe(secondTown.friendlyName);
      expect(firstTown.coveyTownID)
        .not
        .toBe(secondTown.coveyTownID);
      expect(firstTown.mapID)
        .toBe(secondTown.mapID);
      expect(firstTown.enableVideo)
        .toBe(secondTown.enableVideo);
      expect(firstTown.enableProximity)
        .toBe(secondTown.enableProximity);
    });
  });

  describe('getControllerForTown', () => {
    it('Should return the same controller on repeated calls', async () => {
      const firstTown = createTownForTesting(MapSelection.Standard, true, true);
      expect(firstTown)
        .toBe(CoveyTownsStore.getInstance()
          .getControllerForTown(firstTown.coveyTownID));
      expect(firstTown)
        .toBe(CoveyTownsStore.getInstance()
          .getControllerForTown(firstTown.coveyTownID));
    });
  });

  describe('updateTown', () => {
    it('Should check the password before updating any value', () => {
      const town = createTownForTesting(MapSelection.Standard, true, true);
      const { friendlyName } = town;
      const res = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, 'abcd', 'newName', true);
      expect(res)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);
      expect(town.isPubliclyListed)
        .toBe(false);

    });
    it('Should fail if the townID does not exist', async () => {
      const town = createTownForTesting(MapSelection.Standard, true, true);
      const { friendlyName } = town;

      const res = CoveyTownsStore.getInstance()
        .updateTown('abcdef', town.townUpdatePassword, 'newName', true);
      expect(res)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);
      expect(town.isPubliclyListed)
        .toBe(false);

    });
    it('Should update the town parameters', async () => {

      // First try with just a visiblity change
      const town = createTownForTesting(MapSelection.Standard, true, true);
      const { friendlyName } = town;
      const res = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, undefined, true);
      expect(res)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(true);
      expect(town.friendlyName)
        .toBe(friendlyName);

      // Now try with just a name change
      const newFriendlyName = nanoid();
      const res2 = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, newFriendlyName, undefined);
      expect(res2)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(true);
      expect(town.friendlyName)
        .toBe(newFriendlyName);

      // Now try to change both
      const res3 = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, friendlyName, false);
      expect(res3)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);

      // Now try to change both video and proximity and mapID
      const res4 = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, friendlyName, false, MapSelection.Conference, false, false);
      expect(res4)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);
      expect(town.mapID).toBe(MapSelection.Conference);
      expect(town.enableVideo).toBe(false);
      expect(town.enableProximity).toBe(false);
    });
  });

  describe('deleteTown', () => {
    it('Should check the password before deleting the town', () => {
      const town = createTownForTesting(MapSelection.Standard, true, true);
      const res = CoveyTownsStore.getInstance()
        .deleteTown(town.coveyTownID, `${town.townUpdatePassword}*`);
      expect(res)
        .toBe(false);
    });
    it('Should fail if the townID does not exist', async () => {
      const res = CoveyTownsStore.getInstance()
        .deleteTown('abcdef', 'efg');
      expect(res)
        .toBe(false);
    });
    it('Should disconnect all players', async () => {
      const town = createTownForTesting(MapSelection.Standard, true, true);
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.disconnectAllPlayers();

      expect(mockCoveyListenerOtherFns.mock.calls.length)
        .toBe(0);
      expect(mockCoveyListenerTownDestroyed.mock.calls.length)
        .toBe(4);
    });
  });

  describe('listTowns', () => {
    it('Should include public towns', async () => {
      const town = createTownForTesting( MapSelection.Standard, false, true, undefined, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns();
      const entry = towns.filter(townInfo => townInfo.coveyTownID === town.coveyTownID);
      expect(entry.length)
        .toBe(1);
      expect(entry[0].friendlyName)
        .toBe(town.friendlyName);
      expect(entry[0].coveyTownID)
        .toBe(town.coveyTownID);
    });
    it('Should include each CoveyTownID if there are multiple towns with the same friendlyName', async () => {
      const town = createTownForTesting(MapSelection.Standard, false, true, undefined, true);
      const secondTown = createTownForTesting(MapSelection.Standard, false, true, town.friendlyName, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName);
      expect(towns.length)
        .toBe(2);
      expect(towns[0].friendlyName)
        .toBe(town.friendlyName);
      expect(towns[1].friendlyName)
        .toBe(town.friendlyName);

      if (towns[0].coveyTownID === town.coveyTownID) {
        expect(towns[1].coveyTownID)
          .toBe(secondTown.coveyTownID);
      } else if (towns[1].coveyTownID === town.coveyTownID) {
        expect(towns[0].coveyTownID)
          .toBe(town.coveyTownID);
      } else {
        fail('Expected the coveyTownIDs to match the towns that were created');
      }
    });

    it('Should include town with different mapID', async () => {
      const mapID1 = MapSelection.Classroom;
      const mapID2 = MapSelection.Conference;
      const town = createTownForTesting(mapID1, false, false, undefined, true);
      createTownForTesting(mapID2, false, false, town.friendlyName, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName);
      expect(towns.length)
        .toBe(2);
      expect(towns[0].friendlyName)
        .toBe(town.friendlyName);
      expect(towns[1].friendlyName)
        .toBe(town.friendlyName);
      expect(towns[0].mapID).toBe(mapID1);
      expect(towns[1].mapID).toBe(mapID2);
    });

    it('Should include town with video disabled', async () => {
      const mapID1 = MapSelection.Conference;
      const mapID2 = MapSelection.Standard;
      const town = createTownForTesting(mapID1, true, false, undefined, true);
      createTownForTesting(mapID2, false, true, town.friendlyName, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName);
      expect(towns.length)
        .toBe(2);
      expect(towns[0].friendlyName)
        .toBe(town.friendlyName);
      expect(towns[1].friendlyName)
        .toBe(town.friendlyName);
      expect(towns[0].enableVideo).toBe(true);
      expect(towns[1].enableVideo).toBe(false);
      expect(towns[0].enableProximity).toBe(false);
      expect(towns[1].enableProximity).toBe(true);
    });


    it('Should not include private towns', async () => {
      const town = createTownForTesting(MapSelection.Standard, true, true, undefined, false);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(towns.length)
        .toBe(0);
    });
    it('Should not include private towns, even if there is a public town of same name', async () => {
      const town = createTownForTesting(MapSelection.Standard, true, true, undefined, false);
      const town2 = createTownForTesting(MapSelection.Standard, true, true, town.friendlyName, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(towns.length)
        .toBe(1);
      expect(towns[0].coveyTownID)
        .toBe(town2.coveyTownID);
      expect(towns[0].friendlyName)
        .toBe(town2.friendlyName);
    });
    it('Should not include deleted towns', async () => {
      const town = createTownForTesting(MapSelection.Standard, true, true, undefined, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(towns.length)
        .toBe(1);
      const res = CoveyTownsStore.getInstance()
        .deleteTown(town.coveyTownID, town.townUpdatePassword);
      expect(res)
        .toBe(true);
      const townsPostDelete = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(townsPostDelete.length)
        .toBe(0);
    });
  });
});


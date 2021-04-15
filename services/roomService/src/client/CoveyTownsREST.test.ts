import Express from 'express';
import CORS from 'cors';
import http from 'http';
import {nanoid} from 'nanoid';
import assert from 'assert';
import {AddressInfo} from 'net';

import TownsServiceClient, {MapSelection, SpriteRestriction, TownListResponse} from './TownsServiceClient';
import addTownRoutes from '../router/towns';

type TestTownData = {
  friendlyName: string, coveyTownID: string,
  isPubliclyListed: boolean, townUpdatePassword: string
  mapID: MapSelection, enableVideo: boolean, enableProximity: boolean,
  spriteRestriction: SpriteRestriction, restrictedSpriteName: string,
  spriteRestrictionPassword: string,
};

function expectTownListMatches(towns: TownListResponse, town: TestTownData) {
  const matching = towns.towns.find(townInfo => townInfo.coveyTownID === town.coveyTownID);
  if (town.isPubliclyListed) {
    expect(matching)
      .toBeDefined();
    assert(matching);
    expect(matching.friendlyName)
      .toBe(town.friendlyName);
    expect(matching.mapID)
      .toBe(town.mapID);
    expect(matching.enableVideo)
      .toBe(town.enableVideo);
    expect(matching.enableProximity)
      .toBe(town.enableProximity);
    expect(matching.spriteRestriction)
      .toBe(town.spriteRestriction);
    expect(matching.restrictedSpriteName)
      .toBe(town.restrictedSpriteName);
  } else {
    expect(matching)
      .toBeUndefined();
  }
}

describe('TownsServiceAPIREST', () => {
  let server: http.Server;
  let apiClient: TownsServiceClient;

  async function createTownForTesting(mapID: MapSelection, enableVideo: boolean, enableProximity: boolean, spriteRestriction: SpriteRestriction, restrictedSpriteName: string, friendlyNameToUse?: string, isPublic = false): Promise<TestTownData> {
    const friendlyName = friendlyNameToUse !== undefined ? friendlyNameToUse :
      `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
    const ret = await apiClient.createTown({
      friendlyName,
      isPubliclyListed: isPublic,
      mapID,
      enableVideo,
      enableProximity,
      spriteRestriction,
      restrictedSpriteName,
    });
    return {
      friendlyName,
      isPubliclyListed: isPublic,
      coveyTownID: ret.coveyTownID,
      townUpdatePassword: ret.coveyTownPassword,
      spriteRestrictionPassword: ret.spriteRestrictionPassword,
      mapID,
      enableVideo,
      enableProximity,
      spriteRestriction,
      restrictedSpriteName,
    };
  }

  beforeAll(async () => {
    const app = Express();
    app.use(CORS());
    server = http.createServer(app);

    addTownRoutes(server, app);
    await server.listen();
    const address = server.address() as AddressInfo;

    apiClient = new TownsServiceClient(`http://127.0.0.1:${address.port}`);
  });
  afterAll(async () => {
    await server.close();
  });
  describe('CoveyTownCreateAPI', () => {
    it('Allows for multiple towns with the same friendlyName', async () => {
      const firstTown = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa');
      const secondTown = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', firstTown.friendlyName);
      expect(firstTown.coveyTownID)
        .not
        .toBe(secondTown.coveyTownID);
    });
    it('Prohibits a blank friendlyName', async () => {
      try {
        await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', '');
        fail('createTown should throw an error if friendly name is empty string');
      } catch (err) {
        // OK
      }
    });
    it('Prohibits a blank spriteRestrictionName if spriteRestriction is passwordUsers', async () => {
      try {
        await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.passwordUsers, '', '');
        fail('createTown should throw an error if blank spriteRestrictionName when spriteRestriction is passwordUsers');
      } catch (err) {
        // OK
      }
    });
    it('Prohibits a blank spriteRestrictionName if spriteRestriction is noUsers', async () => {
      try {
        await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.noUsers, '', '');
        fail('createTown should throw an error if blank spriteRestrictionName when spriteRestriction is noUsers');
      } catch (err) {
        // OK
      }
    });
    it('Allows for blank spriteRestrictionName if spriteRestriction is allUsers', async () => {
      const allUsersTown = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, '');
      expect(allUsersTown.spriteRestriction).toBeDefined();
    });
    it('Generates a random string for sprite restriction password', async () => {
      const townOne = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, '');
      const townTwo = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, '');

      expect(townOne.spriteRestrictionPassword)
        .not
        .toBe(townTwo.spriteRestrictionPassword);
    });
  });

  describe('CoveyTownListAPI', () => {
    it('Lists public towns, but not private towns', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      const privTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, false);
      const pubTown2 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      const privTown2 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, false);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, pubTown1);
      expectTownListMatches(towns, pubTown2);
      expectTownListMatches(towns, privTown1);
      expectTownListMatches(towns, privTown2);

    });
    it('Lists towns with different mapID', async () => {
      const mapID1 = MapSelection.Conference;
      const mapID2 = MapSelection.Classroom;
      const pubTown1 = await createTownForTesting(mapID1, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      const pubTown2 = await createTownForTesting(mapID2, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, pubTown1);
      expectTownListMatches(towns, pubTown2);
    });
    it('Lists towns with video disabled', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, false, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      const pubTown2 = await createTownForTesting(MapSelection.Standard, false, true, SpriteRestriction.allUsers, 'misa', undefined, true);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, pubTown1);
      expectTownListMatches(towns, pubTown2);
    });
    it('Lists towns with proximity disabled', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, false, SpriteRestriction.allUsers, 'misa', undefined, true);
      const pubTown2 = await createTownForTesting(MapSelection.Standard, true, false, SpriteRestriction.allUsers, 'misa', undefined, true);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, pubTown1);
      expectTownListMatches(towns, pubTown2);
    });
    it('Lists towns with different SpriteSelection modes', async () => {
      const passwordTown = await createTownForTesting(MapSelection.Standard, true, false, SpriteRestriction.passwordUsers, 'misa', undefined, true);
      const noRestTown = await createTownForTesting(MapSelection.Standard, true, false, SpriteRestriction.noUsers, 'misa', undefined, true);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, passwordTown);
      expectTownListMatches(towns, noRestTown);
    });
    it('Lists towns with different restricted sprite names', async () => {
      const bidoTown = await createTownForTesting(MapSelection.Standard, true, false, SpriteRestriction.allUsers, 'bido', undefined, true);
      const liloTown = await createTownForTesting(MapSelection.Standard, true, false, SpriteRestriction.allUsers, 'lilo', undefined, true);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, bidoTown);
      expectTownListMatches(towns, liloTown);
    });
    it('Allows for multiple towns with the same friendlyName', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      const privTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', pubTown1.friendlyName, false);
      const pubTown2 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa',  pubTown1.friendlyName, true);
      const privTown2 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', pubTown1.friendlyName, false);

      const towns = await apiClient.listTowns();
      expectTownListMatches(towns, pubTown1);
      expectTownListMatches(towns, pubTown2);
      expectTownListMatches(towns, privTown1);
      expectTownListMatches(towns, privTown2);
    });
  });

  describe('CoveyTownDeleteAPI', () => {
    it('Throws an error if the password is invalid', async () => {
      const { coveyTownID } = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      try {
        await apiClient.deleteTown({
          coveyTownID,
          coveyTownPassword: nanoid(),
        });
        fail('Expected deleteTown to throw an error');
      } catch (e) {
        // Expected error
      }
    });
    it('Throws an error if the townID is invalid', async () => {
      const { townUpdatePassword } = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      try {
        await apiClient.deleteTown({
          coveyTownID: nanoid(),
          coveyTownPassword: townUpdatePassword,
        });
        fail('Expected deleteTown to throw an error');
      } catch (e) {
        // Expected error
      }
    });
    it('Deletes a town if given a valid password and town, no longer allowing it to be joined or listed', async () => {
      const { coveyTownID, townUpdatePassword } = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      await apiClient.deleteTown({
        coveyTownID,
        coveyTownPassword: townUpdatePassword,
      });
      try {
        await apiClient.joinTown({
          userName: nanoid(),
          avatarName: 'misa',
          coveyTownID,
          spriteRestrictionPassword: '',
        });
        fail('Expected joinTown to throw an error');
      } catch (e) {
        // Expected
      }
      const listedTowns = await apiClient.listTowns();
      if (listedTowns.towns.find(r => r.coveyTownID === coveyTownID)) {
        fail('Expected the deleted town to no longer be listed');
      }
    });
  });
  describe('CoveyTownUpdateAPI', () => {
    it('Checks the password before updating any values', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      expectTownListMatches(await apiClient.listTowns(), pubTown1);
      try {
        await apiClient.updateTown({
          coveyTownID: pubTown1.coveyTownID,
          coveyTownPassword: `${pubTown1.townUpdatePassword}*`,
          friendlyName: 'broken',
          isPubliclyListed: false,
        });
        fail('updateTown with an invalid password should throw an error');
      } catch (err) {
        // Expected
      }

      // Make sure name or vis didn't change
      expectTownListMatches(await apiClient.listTowns(), pubTown1);
    });
    it('Updates the friendlyName and visbility as requested', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, false);
      expectTownListMatches(await apiClient.listTowns(), pubTown1);
      await apiClient.updateTown({
        coveyTownID: pubTown1.coveyTownID,
        coveyTownPassword: pubTown1.townUpdatePassword,
        friendlyName: 'newName',
        isPubliclyListed: true,
      });
      pubTown1.friendlyName = 'newName';
      pubTown1.isPubliclyListed = true;
      expectTownListMatches(await apiClient.listTowns(), pubTown1);
    });
    it('Does not update the visibility if visibility is undefined', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      expectTownListMatches(await apiClient.listTowns(), pubTown1);
      await apiClient.updateTown({
        coveyTownID: pubTown1.coveyTownID,
        coveyTownPassword: pubTown1.townUpdatePassword,
        friendlyName: 'newName2',
      });
      pubTown1.friendlyName = 'newName2';
      expectTownListMatches(await apiClient.listTowns(), pubTown1);
    });
  });

  describe('CoveyMemberAPI', () => {
    it('Throws an error if the town does not exist', async () => {
      await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      try {
        await apiClient.joinTown({
          userName: nanoid(),
          avatarName: 'misa',
          coveyTownID: '0',
          spriteRestrictionPassword: '',
        });
        fail('Expected an error to be thrown by joinTown but none thrown');
      } catch (err) {
        // Expected
      }
    });
    it('Admits a user to a valid public or private town', async () => {
      const pubTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, true);
      const privTown1 = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.allUsers, 'misa', undefined, false);
      const res = await apiClient.joinTown({
        userName: nanoid(),
        avatarName: 'misa',
        coveyTownID: pubTown1.coveyTownID,
        spriteRestrictionPassword: '',
      });
      expect(res.coveySessionToken)
        .toBeDefined();
      expect(res.coveyUserID)
        .toBeDefined();

      const res2 = await apiClient.joinTown({
        userName: nanoid(),
        avatarName: 'misa',
        coveyTownID: privTown1.coveyTownID,
        spriteRestrictionPassword: '',
      });
      expect(res2.coveySessionToken)
        .toBeDefined();
      expect(res2.coveyUserID)
        .toBeDefined();
    });
    it('Calculates spritePasswordOverride correctly when spriteRestriction is passwordUsers', async () => {
      const townOne = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.passwordUsers, 'misa', undefined, true);
      const townTwo = await createTownForTesting(MapSelection.Standard, true, true, SpriteRestriction.passwordUsers, 'misa', undefined, true);
      const res = await apiClient.joinTown({
        userName: nanoid(),
        avatarName: 'misa',
        coveyTownID: townOne.coveyTownID,
        spriteRestrictionPassword: townOne.spriteRestrictionPassword,
      });
      expect(res.spritePasswordOverride)
        .toBe(true);

      const res2 = await apiClient.joinTown({
        userName: nanoid(),
        avatarName: 'misa',
        coveyTownID: townTwo.coveyTownID,
        spriteRestrictionPassword: '123',
      });
      expect(res2.spritePasswordOverride)
        .toBe(false);
    });
  });
});

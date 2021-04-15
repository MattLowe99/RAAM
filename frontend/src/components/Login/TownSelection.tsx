import React, {useCallback, useEffect, useState} from 'react';
import assert from "assert";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TableCaption,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react';
import useVideoContext from '../VideoCall/VideoFrontend/hooks/useVideoContext/useVideoContext';
import Video from '../../classes/Video/Video';
import {CoveyTownInfo, TownJoinResponse,} from '../../classes/TownsServiceClient';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import {MapSelection, SpriteRestriction} from '../../CoveyTypes';


interface TownSelectionProps {
  doLogin: (initData: TownJoinResponse, mapID: MapSelection, enableVideo: boolean, enableProximity: boolean) => Promise<boolean>
}

const avatars = ['misa', 'bido'];

export default function TownSelection({ doLogin }: TownSelectionProps): JSX.Element {
  const [userName, setUserName] = useState<string>(Video.instance()?.userName || '');
  const [newTownName, setNewTownName] = useState<string>('');
  const [newTownIsPublic, setNewTownIsPublic] = useState<boolean>(true);
  const [townIDToJoin, setTownIDToJoin] = useState<string>('');
  const [currentPublicTowns, setCurrentPublicTowns] = useState<CoveyTownInfo[]>();
  const [avatarIndex, setAvatarIndex] = useState<number>(0);
  const { connect } = useVideoContext();
  const { apiClient } = useCoveyAppState();
  const toast = useToast();
  const preview = `../../assets/${avatars[avatarIndex]}-preview.png`;
  const [mapID, setMapID] = useState<string>('1');
  const [enableVideo, setEnableVideo] = useState<boolean>(true);
  const [enableProximity, setEnableProximity] = useState<boolean>(true);
  const [spriteRestriction, setSpriteRestriction] = useState<string>('1');
  const [restrictedSprite, setRestrictedSprite] = useState<string>('misa');
  const [spritePassword, setSpritePassword] = useState<string>('');

  const updateTownListings = useCallback(() => {
    apiClient.listTowns()
      .then((towns) => {
        setCurrentPublicTowns(towns.towns
          .sort((a, b) => b.currentOccupancy - a.currentOccupancy)
        );
      })
  }, [setCurrentPublicTowns, apiClient]);
  useEffect(() => {
    updateTownListings();
    const timer = setInterval(updateTownListings, 2000);
    return () => {
      clearInterval(timer)
    };
  }, [updateTownListings]);

  const handleJoin = useCallback(async (coveyRoomID: string, avatar: string, index: number, password: string) => {
    try {
      if (!userName || userName.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please select a username',
          status: 'error',
        });
        return;
      }
      if (!coveyRoomID || coveyRoomID.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please enter a town ID',
          status: 'error',
        });
        return;
      }
      const initData = await Video.setup(userName, coveyRoomID, avatar, password);

      if (initData.spriteRestriction === SpriteRestriction.passwordUsers) {
        if (!initData.spritePasswordOverride && initData.restrictedSpriteName !== avatars[index]) {
          const capitalizedName = initData.restrictedSpriteName.charAt(0).toUpperCase() + initData.restrictedSpriteName.slice(1);
          toast({
            title: 'Unable to join town',
            description: `Please enter a valid password to override avatar restriction or select ${capitalizedName} as your avatar.`,
            status: 'error',
          });
          return;
        }
      }

      if (initData.spriteRestriction === SpriteRestriction.noUsers) {
        if (initData.restrictedSpriteName !== avatars[index]) {
          toast({
            title: 'Unable to join town',
            description: `Please select ${initData.restrictedSpriteName} as your avatar.`,
            status: 'error',
          });
          return;
        }
      }

      const loggedIn = await doLogin(initData, initData.mapID, initData.enableVideo, initData.enableProximity);

      if (loggedIn) {
        assert(initData.providerVideoToken);
        await connect(initData.providerVideoToken);
      }
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
    }
  }, [doLogin, userName, connect, toast]);

  const handleCreate = async (index: number) => {
    let spriteCustom = SpriteRestriction.allUsers;
    if (spriteRestriction === '2') {
      spriteCustom = SpriteRestriction.passwordUsers;
    } else if (spriteRestriction === '3') {
      spriteCustom = SpriteRestriction.noUsers;
    }

    let mapIDE = MapSelection.Party;
    if (mapID === '1') {
      mapIDE = MapSelection.Standard;
    } else if (mapID === '2') {
      mapIDE = MapSelection.Conference;
    } else if (mapID === '3') {
      mapIDE = MapSelection.Classroom;
    }
    if (!userName || userName.length === 0) {
      toast({
        title: 'Unable to create town',
        description: 'Please select a username before creating a town',
        status: 'error',
      });
      return;
    }
    if (!newTownName || newTownName.length === 0) {
      toast({
        title: 'Unable to create town',
        description: 'Please enter a town name',
        status: 'error',
      });
      return;
    }
    if (spriteCustom !== SpriteRestriction.allUsers && restrictedSprite !== avatars[index]) {
      toast({
        title: 'Unable to create town',
        description: 'Please set your selected avatar to match restricted avatar choice.',
        status: 'error',
      });
      return;
    }
    try {
      const newTownInfo = await apiClient.createTown({
        friendlyName: newTownName,
        isPubliclyListed: newTownIsPublic,
        mapID: mapIDE,
        enableVideo,
        enableProximity,
        spriteRestriction: spriteCustom,
        restrictedSpriteName: restrictedSprite,
      });
      let privateMessage = <></>;
      let restrictionMessage = <></>;
      if (!newTownIsPublic) {
        privateMessage =
          <p>This town will NOT be publicly listed. To re-enter it, you will need to use this
            ID: {newTownInfo.coveyTownID}</p>;
      }
      if (spriteCustom === SpriteRestriction.passwordUsers) {
        restrictionMessage =
          <p>Please record this value, you will not be able to view it again. To override sprite restriction, enter: {newTownInfo.spriteRestrictionPassword}</p>
      }
      toast({
        title: `Town ${newTownName} is ready to go!`,
        description: <>{privateMessage}Please record these values in case you need to change the
          room:<br/>Town ID: {newTownInfo.coveyTownID}<br/>Town Editing
          Password: {newTownInfo.coveyTownPassword}<br/>
          {restrictionMessage}</>,
        status: 'success',
        isClosable: true,
        duration: null,
      })
      await handleJoin(newTownInfo.coveyTownID, avatars[index], index, spritePassword);
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
    }
  };

  const handleAvatar = (increase: boolean) => {
    if (increase) {
      if (avatarIndex < avatars.length - 1) {
        setAvatarIndex(avatarIndex + 1);
      } else {
        setAvatarIndex(0);
      }
    } else if (avatarIndex > 0) {
        setAvatarIndex(avatarIndex - 1);
    }
    else {
      setAvatarIndex(avatars.length - 1);
    }
  }

  const handleAvatarName = (index: number) => {
    const avatarName = avatars[index];

    return avatarName.charAt(0).toUpperCase() + avatarName.slice(1);
  }

  const generateSpriteOptions = () => {
    const optionsArr = [];

    for (let i = 0; i < avatars.length; i += 1) {
      const uppercaseName = handleAvatarName(i);

      optionsArr.push(<option value={avatars[i]}>{uppercaseName}</option>);
    }

    return optionsArr;
  }

  return (
    <>
      <form>
        <Stack>
          <Box p="4" borderWidth="1px" borderRadius="lg">
            <Heading as="h2" size="lg">Select a username</Heading>
            <FormControl>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input autoFocus name="name" placeholder="Your name"
                value={userName}
                onChange={event => setUserName(event.target.value)}
              />
            </FormControl>
          </Box>
          <Box p="4" borderWidth="1px" borderRadius="lg">
            <Heading as="h2" size="lg">Customize your avatar</Heading>
            <FormControl>
              <Flex p="4">
                <Box flex="1">
                  <img src={preview} alt="avatar" />
                </Box>
                <Box flex="3"/>
              </Flex>
              <Heading as="h3" size="md" pl="16">{handleAvatarName(avatarIndex)}</Heading>
              <Flex p="4">
                <Box flex="1">
                  <Button data-testid='updateAvatar'
                          onClick={() => handleAvatar(false)}>&#8592;</Button>
                  <text>&nbsp;&nbsp;&nbsp;&nbsp;{avatarIndex + 1}/{avatars.length}&nbsp;&nbsp;&nbsp;&nbsp;</text>
                  <Button data-testid='updateAvatar'
                          onClick={() => handleAvatar(true)}>&#8594;</Button>
                  <FormControl>
                    <FormLabel htmlFor="avatarPassword">Avatar Restriction Password</FormLabel>
                    <Input name="avatarPassword" placeholder="Enter password"
                           value={spritePassword}
                           onChange={event => setSpritePassword(event.target.value)}
                    />
                  </FormControl>
                </Box>
              </Flex>
            </FormControl>
          </Box>
          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Create a New Town</Heading>
            <Flex p="4">
              <Box flex="1">
                <FormControl>
                  <FormLabel htmlFor="townName">New Town Name</FormLabel>
                  <Input name="townName" placeholder="New Town Name"
                         value={newTownName}
                         onChange={event => setNewTownName(event.target.value)}
                  />
                </FormControl>
              </Box><Box>
              <FormControl>
                <FormLabel htmlFor="isPublic">Publicly Listed</FormLabel>
                <Checkbox id="isPublic" name="isPublic" isChecked={newTownIsPublic}
                          onChange={(e) => {
                            setNewTownIsPublic(e.target.checked)
                          }}/>
              </FormControl>
            </Box>
              <Box>
                <Button data-testid="newTownButton" onClick={() => handleCreate(avatarIndex)}>Create</Button>
              </Box>
            </Flex>
            <Flex>
              <Box p="4" borderWidth="1px" borderRadius="lg">
                <Heading as="h2" size="lg">Select a Room Map</Heading>
                  <RadioGroup value={mapID} onChange={event => setMapID(event.toString())}>
                    <SimpleGrid spacing={1} columns={9}>
                      <Radio value='1'> Playground </Radio>
                      <Radio value='2'> Conference Room </Radio>
                      <Radio value='3'> Class Room </Radio>
                      <Radio value='4'> Party Room </Radio>
                    </SimpleGrid>
                  </RadioGroup>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel htmlFor="enableVideo">Video</FormLabel>
                  <Checkbox id="enableVideo" name="enableVideo" isChecked={enableVideo}
                          onChange={(e) => {
                            setEnableVideo(e.target.checked)
                          }}/>
                </FormControl>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel htmlFor="enableProximity">Enable Proximity</FormLabel>
                  <Checkbox id="enableProximity" name="enableProximity" isChecked={enableProximity}
                          onChange={(e) => {
                            setEnableProximity(e.target.checked)
                          }}/>
                </FormControl>
              </Box>
            </Flex>
            <Flex>
              <Box p="4" borderWidth="1px" borderRadius="lg">
                <Heading as="h2" size="lg">Avatar Customization</Heading>
                <Text fontSize="sm">Set which users are allowed to customize their avatar.</Text>
                <RadioGroup value={spriteRestriction} onChange={event => setSpriteRestriction(event.toString())}>
                  <SimpleGrid spacing={1} columns={9}>
                      <Radio value='1'> All Users </Radio>
                      <Radio value='2'> Password Users </Radio>
                      <Radio value='3'> No Users </Radio>
                  </SimpleGrid>
                </RadioGroup>
              </Box>
              <Box display={spriteRestriction === '1' ? 'none':''}>
                <FormControl>
                  <FormLabel htmlFor="chooseSprite">Choose Sprite for Restricted Users</FormLabel>
                  <Select id="chooseSprite" size="md" w={200} onChange={event => setRestrictedSprite(event.target.value)}>
                    {generateSpriteOptions()}
                  </Select>
                </FormControl>
              </Box>
            </Flex>
          </Box>
          <Heading p="4" as="h2" size="lg">-or-</Heading>

          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Join an Existing Town</Heading>
            <Box borderWidth="1px" borderRadius="lg">
              <Flex p="4"><FormControl>
                <FormLabel htmlFor="townIDToJoin">Town ID</FormLabel>
                <Input name="townIDToJoin" placeholder="ID of town to join, or select from list"
                       value={townIDToJoin}
                       onChange={event => setTownIDToJoin(event.target.value)}/>
              </FormControl>
                <Button data-testid='joinTownByIDButton'
                        onClick={() => handleJoin(townIDToJoin, avatars[avatarIndex], avatarIndex, spritePassword)}>Connect</Button>
              </Flex>

            </Box>

            <Heading p="4" as="h4" size="md">Select a public town to join</Heading>
            <Box maxH="500px" overflowY="scroll">
              <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead><Tr><Th>Room Name</Th><Th>Room ID</Th><Th>Map ID</Th><Th>Video</Th><Th>Proximity</Th><Th>Activity</Th></Tr></Thead>
                <Tbody>
                  {currentPublicTowns?.map((town) => (
                    <Tr key={town.coveyTownID}><Td role='cell'>{town.friendlyName}</Td><Td
                      role='cell'>{town.coveyTownID}</Td>
                      <Td role='cell'>{town.mapID.toString()}</Td>
                      <Td role='cell'>{town.enableVideo.toString()}</Td>
                      <Td role='cell'>{town.enableProximity.toString()}</Td>
                      <Td role='cell'>{town.currentOccupancy}/{town.maximumOccupancy}
                        <Button onClick={() => handleJoin(town.coveyTownID, avatars[avatarIndex], avatarIndex, spritePassword)}
                                disabled={town.currentOccupancy >= town.maximumOccupancy}>Connect</Button></Td></Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Stack>
      </form>
    </>
  );
}

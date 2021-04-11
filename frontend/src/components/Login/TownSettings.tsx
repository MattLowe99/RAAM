import React, { useCallback, useState } from 'react';

import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Radio,
  RadioGroup,
  SimpleGrid,
  Flex, 
  useToast
} from '@chakra-ui/react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import useMaybeVideo from '../../hooks/useMaybeVideo';
import { MapSelection } from '../../CoveyTypes';

const TownSettings: React.FunctionComponent = () => {
  const {isOpen, onOpen, onClose} = useDisclosure()
  const video = useMaybeVideo()
  const {apiClient, currentTownID, currentTownFriendlyName, currentTownIsPubliclyListed, mapID, enableVideo, enableProximity} = useCoveyAppState();
  // const {apiClient, currentTownID, currentTownFriendlyName, currentTownIsPubliclyListed} = useCoveyAppState();
  const [friendlyName, setFriendlyName] = useState<string>(currentTownFriendlyName);
  const [isPubliclyListed, setIsPubliclyListed] = useState<boolean>(currentTownIsPubliclyListed);
  const [roomUpdatePassword, setRoomUpdatePassword] = useState<string>('');

  let cmapIDi = '3';
  if (mapID === MapSelection.Standard) {
    cmapIDi = '1';
  } else if (mapID === MapSelection.Conference) {
    cmapIDi = '2';
  }
  const [cmapID, setcMapID] = useState<string>(cmapIDi);
  const [videoEnabled, setEnableVideo] = useState<boolean>(enableVideo);
  const [proximityEnabled, setEnableProximity] = useState<boolean>(enableProximity);

  const openSettings = useCallback(()=>{
    onOpen();
    video?.pauseGame();
  }, [onOpen, video]);

  const closeSettings = useCallback(()=>{
    onClose();
    video?.unPauseGame();
  }, [onClose, video]);

  const toast = useToast()
  const processUpdates = async (action: string) =>{
    let mapIDE = MapSelection.Classroom;
    if (cmapID === '1') {
      mapIDE = MapSelection.Standard;
    } else if (cmapID === '2') {
      mapIDE = MapSelection.Conference;
    }

    if(action === 'delete'){
      try{
        await apiClient.deleteTown({coveyTownID: currentTownID,
          coveyTownPassword: roomUpdatePassword});
        toast({
          title: 'Town deleted',
          status: 'success'
        })
        closeSettings();
      }catch(err){
        toast({
          title: 'Unable to delete town',
          description: err.toString(),
          status: 'error'
        });
      }
    }else {
      try {
        await apiClient.updateTown({
          coveyTownID: currentTownID,
          coveyTownPassword: roomUpdatePassword,
          friendlyName,
          isPubliclyListed,
          mapID: mapIDE,
          enableVideo: videoEnabled,
          enableProximity: proximityEnabled,
        });
        toast({
          title: 'Town updated',
          description: 'To see the updated town, please exit and re-join this town',
          status: 'success'
        })
        closeSettings();
      }catch(err){
        toast({
          title: 'Unable to update town',
          description: err.toString(),
          status: 'error'
        });
      }
    }
  };

  return <>
    <MenuItem data-testid='openMenuButton' onClick={openSettings}>
      <Typography variant="body1">Town Settings</Typography>
    </MenuItem>
    <Modal isOpen={isOpen} onClose={closeSettings}>
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>Edit town {currentTownFriendlyName} ({currentTownID})</ModalHeader>
        <ModalCloseButton/>
        <form onSubmit={(ev)=>{ev.preventDefault(); processUpdates('edit')}}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='friendlyName'>Friendly Name</FormLabel>
              <Input id='friendlyName' placeholder="Friendly Name" name="friendlyName" value={friendlyName} onChange={(ev)=>setFriendlyName(ev.target.value)} />
            </FormControl>
            <Flex>
            <FormControl mt={4}>
              <FormLabel htmlFor='isPubliclyListed'>Publicly Listed</FormLabel>
              <Checkbox id="isPubliclyListed" name="isPubliclyListed"  isChecked={isPubliclyListed} onChange={(e)=>setIsPubliclyListed(e.target.checked)} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor='enableVideo'>Video</FormLabel>
              <Checkbox id="" name="enableVideo"  isChecked={videoEnabled} onChange={(e)=>setEnableVideo(e.target.checked)} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor='enableProximity'>Enable Proximity</FormLabel>
              <Checkbox id="" name="enableProximity"  isChecked={proximityEnabled} onChange={(e)=>setEnableProximity(e.target.checked)} />
            </FormControl>
            </Flex>
            <RadioGroup value={cmapID} onChange={event => setcMapID(event.toString())}>
                <SimpleGrid spacing={1} columns={9}>
                  <Radio value="1"> Playground </Radio>
                  <Radio value="2"> Conference Room </Radio>
                  <Radio value="3"> Class Room </Radio>
                </SimpleGrid>
              </RadioGroup>
            <FormControl isRequired>
              <FormLabel htmlFor="updatePassword">Town Update Password</FormLabel>
              <Input data-testid="updatePassword" id="updatePassword" placeholder="Password" name="password" type="password" value={roomUpdatePassword} onChange={(e)=>setRoomUpdatePassword(e.target.value)} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button data-testid='deletebutton' colorScheme="red" mr={3} value="delete" name='action1' onClick={()=>processUpdates('delete')}>
              Delete
            </Button>
            <Button data-testid='updatebutton' colorScheme="blue" mr={3} value="update" name='action2' onClick={()=>processUpdates('edit')}>
              Update
            </Button>
            <Button onClick={closeSettings}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  </>
}


export default TownSettings;

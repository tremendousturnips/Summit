import axios from 'axios';
import { SELECT_ROOM, ADD_ROOM, SET_ROOMS } from './actionTypes';
import { fetchChannels, postChannel, selectChannel } from './channels';
import { fetchProfiles, addProfile } from './profiles';

//TODO: create action and corresponding socket event to send 
  //profile data to new users who join a room


//LITERALLY NO ERROR HANDLING ANYWHERE YO.

export const selectRoom = room => ({
  type: SELECT_ROOM,
  room
});

export const changeRoom = roomId => {
  return (dispatch, getState) => {
    const firstChannelId = getState().channelsByRoom[roomId][0];
    Promise.all([
      dispatch(selectRoom({id: roomId})),
      dispatch(selectChannel(getState().channels[firstChannelId]))
    ]);
  }
}

export const addRoom = room => ({
  type: ADD_ROOM,
  room
});

export const postRoom = room => {
  return (dispatch, getState) => {
    return axios.post(`/api/rooms/`, room)
      .then((res) => {
        console.log(res.data);
        Promise.all([
          axios.post(`/api/roles`, {room_id: res.data.id, user_id: getState().user.id, privilege_level: 'admin'}),
          dispatch(addRoom(res.data)),
          subscribeRoom(res.data.id, getState().user, getState().socket),
          dispatch(postChannel({name: 'General', room_id: res.data.id}))
        ]);
      })
  }
}

export const setRooms = rooms => ({
  type: SET_ROOMS,
  rooms
});

export const subscribeRoom = (roomId, user, socket) => {
  socket.emit('join room', {roomId, user});
};

//TODO: refactor this action to be more reusable as is it very similar to postRoom and fetchRooms
export const joinRoom = room => {
  return (dispatch, getState) => {
    if (!getState().rooms.hasOwnProperty(room.id)) {
      Promise.all([
        axios.post(`/api/roles`, {room_id: room.id, user_id: getState().user.id, privilege_level: 'guest'}),
        dispatch(addRoom(room)),
        subscribeRoom(room.id, getState().user, getState().socket),
        dispatch(fetchChannels(room.id))
      ]);
    }
  }
}

export const fetchRooms = () => {
  return (dispatch, getState) => {
    
    return axios.get(`/api/profiles/${getState().user.id}/rooms`)
      .then((res)=>{
        dispatch(setRooms(res.data));
      })
      .then(()=>{
        const {rooms, socket, user} = getState();
        for (let roomId in rooms) {
          Promise.all([
            dispatch(fetchProfiles(roomId)),
            dispatch(addProfile(user)),
            dispatch(fetchChannels(roomId)),
            subscribeRoom(roomId, user, socket)
          ])
        }
      })
      .catch( err => {
        console.log(err);
      });
  }
}

import React from 'react'
import "../styles/VideoComponent.css";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import { useRef,useState,useEffect } from 'react';
const server_url="http://localhost:3000"
import io from "socket.io-client";

var connections={};

const peerConfigConnections={
    "iceServers":[
        {"urls":"stun:stun.l.google.com:19302"}
    ]
}



const VideoMeetComponent = () => {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])


    useEffect(()=>{
        getPermissions()
    },[])

    let getUserMediaSuccess=(stream)=>{
        try{
            windows.localstream.getTracks().forEach(track=>track.stop())
        }catch(e){
            console.log(e)
        }

        window.localStream=stream
        localVideoref.current.srcObject=stream

        for(let id in connections){
            if(id=== socketIdRef.current) continue

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description)=>{
                console.log(description)
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal",id,JSON.stringify({"sdp":connections[id].localDescription}))
                })
                .catch(e=>console.log(e))
            })
        }
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }


    useEffect(()=>{
        if(video!== undefined && audio !== undefined){
            getUserMedia();
        }
    },[audio,video])

let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    const addMessage=()=>{
        
    }

    let connectToSocketServer=()=>{
        socketRef.current=io.connect(server_url,{secure:false})

        
        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                        
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                        connections[socketListId].onaddstream = (event) => {

                            console.log("BEFORE:", videoRef.current);
                            console.log("FINDING ID: ", socketListId);
    
                            let videoExists = videoRef.current.find(video => video.socketId === socketListId);


    
                            if (videoExists) {
                                console.log("FOUND EXISTING");

                                setVideos(videos => {
                                    const updatedVideos = videos.map(video =>
                                        video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                    );
                                    videoRef.current = updatedVideos;
                                    return updatedVideos;
                                });




                            } else {
                                
                                console.log("CREATING NEW");
                                let newVideo = {
                                    socketId: socketListId,
                                    stream: event.stream,
                                    autoplay: true,
                                    playsinline: true
                                };
    
                                setVideos(videos => {
                                    const updatedVideos = [...videos, newVideo];
                                    videoRef.current = updatedVideos;
                                    return updatedVideos;
                                });
                            }
                        };
                        if(window.localStream!==undefined && window.localStrea!==null){
                            connections[socketListId].addStream(window.localStream)
                        }
                        else{

                        }
                        
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }

            })
        })
    }


    let getMedia=()=>{
        setVideo(videoAvailable);
        setAudio(audioAvailable)
        connectToSocketServer();

    }


    const getPermissions=async ()=>{
        try{

            // Video Permissin Access

            const videoPermisson=await navigator.mediaDevices.getUserMedia({video:true});
            if(videoPermisson){
                setVideoAvailable(true);
                console.log("Video permission granted");
            }else{
                setVideoAvailable(false);
                console.log("video permission denied");
            }

            // Audio Permission Access

            const audioPermission=await navigator.mediaDevices.getUserMedia({audio:true});
            if(audioPermission){
                setAudioAvailable(true);
                console.log('Audio permission granted');
            }else{
                setAudioAvailable(false);
                console.log("Audio permission denied");
            }

            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true)
            }else{
                setScreenAvailable(false)
            }
            

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }


        }catch(err){
            console.log(err)
        }
    }


    const connect=()=>{
        setAskForUsername(false);
        getMedia()
    }

    

  return (
    <div>

        {askForUsername===true?
        <div>
            <h2>Enter into Lobby </h2>
            <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
            <Button variant="contained" onClick={connect}>Connect</Button>

            <div>
                <video ref={localVideoref} autoPlay muted></video>
            </div>

        </div>
        :<></>
        }


        </div>
  )
}


export default VideoMeetComponent;
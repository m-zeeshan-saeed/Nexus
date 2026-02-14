import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { Button } from "../ui/Button";
import { useCallback, useMemo } from "react";

interface VideoCallModalProps {
  roomId: string;
  targetUserId: string;
  onClose: () => void;
  isIncoming?: boolean;
  callType?: "video" | "voice";
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  roomId,
  targetUserId,
  onClose,
  isIncoming = false,
  callType = "video",
}) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "voice");
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const servers = useMemo(
    () => ({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    }),
    [],
  );

  const handleEndCall = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    socket?.emit("end-call", roomId);
    onClose();
  }, [localStream, roomId, socket, onClose]);

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection(servers);

        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket?.emit("ice-candidate", {
              roomId,
              targetUserId,
              candidate: event.candidate,
            });
          }
        };

        if (!isIncoming) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket?.emit("offer", { roomId, targetUserId, offer });
        }

        socket?.on(
          "offer",
          async (data: { offer: RTCSessionDescriptionInit }) => {
            const { offer } = data;
            if (isIncoming && peerConnection.current) {
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(offer),
              );
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              socket.emit("answer", { roomId, targetUserId, answer });
            }
          },
        );

        socket?.on(
          "answer",
          async (data: { answer: RTCSessionDescriptionInit }) => {
            const { answer } = data;
            if (peerConnection.current) {
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(answer),
              );
            }
          },
        );

        socket?.on(
          "ice-candidate",
          async (data: { candidate: RTCIceCandidateInit }) => {
            const { candidate } = data;
            if (peerConnection.current) {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            }
          },
        );

        socket?.on("call-ended", () => {
          handleEndCall();
        });

        socket?.emit("join-room", roomId);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    startCall();

    return () => {
      socket?.off("offer");
      socket?.off("answer");
      socket?.off("ice-candidate");
      socket?.off("call-ended");
      handleEndCall();
    };
  }, [
    roomId,
    socket,
    isIncoming,
    handleEndCall,
    servers,
    targetUserId,
    callType,
  ]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled =
        !localStream.getAudioTracks()[0].enabled;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled =
        !localStream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Remote Video (Full Screen) */}
        <div className="relative aspect-video bg-gray-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p className="text-lg">Waiting for connection...</p>
            </div>
          )}
        </div>

        {/* Local Video (Floating) */}
        <div className="absolute top-4 right-4 w-1/4 aspect-video bg-gray-700 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6 bg-gray-800 bg-opacity-50 px-8 py-4 rounded-full backdrop-blur-md">
          <Button
            variant="ghost"
            onClick={toggleAudio}
            className={`rounded-full p-4 ${isAudioMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            {isAudioMuted ? (
              <MicOff className="text-white" />
            ) : (
              <Mic className="text-white" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={toggleVideo}
            className={`rounded-full p-4 ${isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            {isVideoOff ? (
              <VideoOff className="text-white" />
            ) : (
              <VideoIcon className="text-white" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleEndCall}
            className="rounded-full p-4 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="text-white" />
          </Button>
        </div>

        {/* Close Button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 left-4 p-2 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all"
        >
          <X className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};

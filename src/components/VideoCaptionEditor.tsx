"use client";

import { Button, Card, Input } from "antd";
import { Download, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

const initialCaptions = [
  {
    id: "1742636722967",
    startTime: 2.481795,
    endTime: 5.481795,
    text: "[A sunny day in the afternoon]",
  },
  {
    id: "1742636753939",
    startTime: 13.726788,
    endTime: 16.726788,
    text: "[A water spring flowing through the grass]",
  },
  {
    id: "1742636783896",
    startTime: 17.301098,
    endTime: 20.301098,
    text: "[A bird is whispering]",
  },
];

export default function VideoCaptionEditor() {
  const isFirstTimeLoad = localStorage.getItem("isFirstTimeLoad");

  const [videoUrl, setVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(true);

  useEffect(() => {
    if (isFirstTimeLoad === null) {
      localStorage.setItem("isFirstTimeLoad", "true");
      setCaptions(initialCaptions);
    }
  }, [isFirstTimeLoad]);

  // Sync video play/pause state with isPlaying state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Format seconds to MM:SS.mmm
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes.toString().padStart(2, "0")}:${Math.floor(secs)
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  // Parse time string to seconds
  const parseTime = (timeStr: string): number => {
    try {
      const [minutesStr, secondsStr] = timeStr.split(":");
      const [secs, millis] = secondsStr.split(".");
      const minutes = Number.parseInt(minutesStr, 10);
      const seconds = Number.parseInt(secs, 10);
      const milliseconds = Number.parseInt(millis, 10);

      if (isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds)) {
        return 0;
      }

      return minutes * 60 + seconds + milliseconds / 1000;
    } catch (error) {
      console.error("Error parsing time:", error);
      return 0;
    }
  };

  // Add a new caption
  const addCaption = () => {
    const newCaption: Caption = {
      id: Date.now().toString(),
      startTime: currentTime,
      endTime: currentTime + 3, // Default 3 seconds duration
      text: "",
    };
    setCaptions((prevCaptions) => [...prevCaptions, newCaption]);
  };

  // Update caption
  const updateCaption = (
    id: string,
    field: keyof Caption,
    value: string | number
  ) => {
    setCaptions((prevCaptions) =>
      prevCaptions.map((caption) => {
        if (caption.id === id) {
          const newValue = field === "text" ? value : Number(value);
          return { ...caption, [field]: newValue };
        }
        return caption;
      })
    );
  };

  // Delete caption
  const deleteCaption = (id: string) => {
    setCaptions(captions.filter((caption) => caption.id !== id));
  };

  // Generate WebVTT content
  const generateWebVTT = (): string => {
    let vtt = "WEBVTT\n\n";

    captions
      .sort((a, b) => a.startTime - b.startTime)
      .forEach((caption, index) => {
        vtt += `${index + 1}\n`;
        vtt += `${formatTime(caption.startTime)} --> ${formatTime(
          caption.endTime
        )}\n`;
        vtt += `${caption.text}\n\n`;
      });

    return vtt;
  };

  // Download WebVTT file
  const downloadWebVTT = () => {
    const vttContent = generateWebVTT();
    const blob = new Blob([vttContent], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "captions.vtt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get current active caption
  const getCurrentCaption = (): string => {
    const activeCaption = captions.find(
      (caption) =>
        currentTime >= caption.startTime && currentTime <= caption.endTime
    );
    return activeCaption?.text || "";
  };

  return (
    <div className="grid p-5 md:grid-cols-2 grid-rows-2 gap-6 h-svh overflow-hidden">
      {/* Video Preview Section */}
      <div className="space-y-4">
        <Card className="!border-2 !border-gray-200">
          <div className="p-4">
            {showUrlInput ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="video-url">Video URL</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="video-url"
                      placeholder="Enter video URL"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <Button
                      type="primary"
                      onClick={() => setShowUrlInput(false)}
                      disabled={!videoUrl}
                    >
                      Load
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Enter a direct URL to a video file (MP4, WebM, etc.)
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onTimeUpdate={(e) =>
                      setCurrentTime(e.currentTarget.currentTime)
                    }
                    className="w-full h-full"
                    onEnded={() => setIsPlaying(false)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-center empty:invisible">
                    {getCurrentCaption()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      variant="outlined"
                      size="small"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          setIsPlaying(true);
                        }
                      }}
                    >
                      Play from Start
                    </Button>
                  </div>
                  <div className="text-sm">{formatTime(currentTime)}</div>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowUrlInput(true)}
                  >
                    Change Video
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Caption Editor Section */}
      <div className="rounded-lg border-2 border-gray-200 overflow-hidden bg-white grid p-4 grid-rows-[auto_1fr] gap-3 row-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Captions</h2>
          <div className="flex gap-2 items-center">
            <Button type="primary" onClick={addCaption} size="middle">
              <Plus className="h-4 w-4 mr-1" /> Add Caption
            </Button>
            <Button
              onClick={downloadWebVTT}
              variant="outlined"
              size="middle"
              disabled={captions.length === 0}
            >
              <Download className="h-4 w-4 mr-1" /> Download VTT
            </Button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 scroll-auto [&::-webkit-scrollbar]:hidden">
          {captions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No captions yet. Click "Add Caption" to create one.
            </div>
          ) : (
            captions
              .sort((a, b) => a.startTime - b.startTime)
              .map((caption) => (
                <div
                  key={caption.id}
                  className="border border-[#7A73D1]/80 bg-[#7A73D1]/10 rounded-md p-3 space-y-3"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label htmlFor={`start-${caption.id}`}>Start Time</label>
                      <Input
                        id={`start-${caption.id}`}
                        defaultValue={formatTime(caption.startTime)}
                        onBlur={(e) => {
                          const newTime = parseTime(e.target.value);
                          if (!isNaN(newTime)) {
                            updateCaption(caption.id, "startTime", newTime);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`end-${caption.id}`}>End Time</label>
                      <Input
                        id={`end-${caption.id}`}
                        defaultValue={formatTime(caption.endTime)}
                        onBlur={(e) => {
                          const newTime = parseTime(e.target.value);
                          if (!isNaN(newTime)) {
                            updateCaption(caption.id, "endTime", newTime);
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="solid"
                        size="middle"
                        className="!bg-red-500 !text-white"
                        onClick={() => deleteCaption(caption.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`text-${caption.id}`}>Caption Text</label>
                    <Input.TextArea
                      id={`text-${caption.id}`}
                      value={caption.text}
                      onChange={(e) =>
                        updateCaption(caption.id, "text", e.target.value)
                      }
                      placeholder="Enter caption text"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = caption.startTime;
                        }
                      }}
                    >
                      Set Current Time as Start
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = caption.endTime;
                        }
                      }}
                    >
                      Jump to End Time
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

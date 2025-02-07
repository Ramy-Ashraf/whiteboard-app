"use client";

import { useState, useRef, useEffect } from "react";
import Toolbar from "./toolbar";

export default function Whiteboard() {
  // Board management states…
  const [boards, setBoards] = useState([
    { id: 1, name: "Board 1", elements: [], pdfUrl: null },
    { id: 2, name: "Board 2", elements: [], pdfUrl: null },
  ]);
  const [activeBoardId, setActiveBoardId] = useState(1);
  const activeBoard = boards.find((b) => b.id === activeBoardId) || {
    elements: [],
  };

  // Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordedChunksRef = useRef([]);

  // Other whiteboard states…
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState("write");
  const [tool, setTool] = useState("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#FFFF00");
  const [textColor, setTextColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(6);
  const [highlightWidth, setHighlightWidth] = useState(40);
  const [selectedElements, setSelectedElements] = useState(new Set());
  const [drawing, setDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [textBox, setTextBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [isMoveIconDragging, setIsMoveIconDragging] = useState(false);
  const [isResizingTextBox, setIsResizingTextBox] = useState(false);
  const [textFontSize, setTextFontSize] = useState(25);

  const svgRef = useRef(null);
  const textInputRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const elementStartPositions = useRef(new Map());

  const getSVGPoint = (clientX, clientY) => {
    const CTM = svgRef.current.getScreenCTM();
    return {
      x: (clientX - CTM.e) / CTM.a,
      y: (clientY - CTM.f) / CTM.d,
    };
  };

  // Update only active board's elements.
  const setActiveBoardElements = (updater) => {
    setBoards((prevBoards) =>
      prevBoards.map((board) => {
        if (board.id === activeBoardId) {
          const newElements =
            typeof updater === "function" ? updater(board.elements) : updater;
          return { ...board, elements: newElements };
        }
        return board;
      })
    );
  };

  // PDF upload handling
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setBoards((prevBoards) =>
        prevBoards.map((board) =>
          board.id === activeBoardId ? { ...board, pdfUrl: url } : board
        )
      );
    }
  };

  // Recording functions using getDisplayMedia and MediaRecorder
  const startRecording = () => {
    Promise.all([
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }),
      navigator.mediaDevices.getUserMedia({ audio: true }),
    ])
      .then(([displayStream, micStream]) => {
        // Combine video track from display with all available audio tracks.
        const tracks = [
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(),
          ...micStream.getAudioTracks(),
        ];
        const combinedStream = new MediaStream(tracks);

        const options = { mimeType: "video/webm" };
        const recorder = new MediaRecorder(combinedStream, options);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          // Stop all tracks from both streams.
          combinedStream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
          recordedChunksRef.current = [];
          const url = URL.createObjectURL(blob);
          // Create a temporary link to download the recorded video.
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "recording.webm";
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      })
      .catch((err) => console.error("Error starting recording:", err));
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Mouse and touch event handlers …
  const handleMouseDown = (e) => {
    const svgPoint = getSVGPoint(e.clientX, e.clientY);
    if (mode === "write") {
      if (tool === "pen" || tool === "highlight") {
        const chosenColor = tool === "pen" ? penColor : highlightColor;
        const chosenWidth = tool === "pen" ? penWidth : highlightWidth;
        setCurrentPath({
          type: tool,
          points: [[svgPoint.x, svgPoint.y]],
          color: chosenColor,
          strokeWidth: chosenWidth,
          id: Date.now(),
        });
        setDrawing(true);
      } else if (tool === "text") {
        dragStartPos.current = svgPoint;
        setTextBox({
          x: svgPoint.x,
          y: svgPoint.y,
          width: 100,
          height: textFontSize * 2,
          content: "",
          id: Date.now(),
          active: false,
          fontSize: textFontSize,
        });
        setIsDragging(true);
      }
    } else if (mode === "select") {
      dragStartPos.current = svgPoint;
      setSelectionRect({
        x1: svgPoint.x,
        y1: svgPoint.y,
        x2: svgPoint.x,
        y2: svgPoint.y,
      });
      setIsDragging(true);

      const clickedElements = activeBoard.elements.filter((el) =>
        isElementInSelection(el, {
          x1: svgPoint.x - 2,
          y1: svgPoint.y - 2,
          x2: svgPoint.x + 2,
          y2: svgPoint.y + 2,
        })
      );

      if (clickedElements.length > 0) {
        const element = clickedElements[clickedElements.length - 1];
        const newSelection = new Set(selectedElements);
        const isModifier = e.shiftKey || e.ctrlKey || e.metaKey;

        if (isModifier) {
          newSelection.has(element.id)
            ? newSelection.delete(element.id)
            : newSelection.add(element.id);
        } else {
          newSelection.clear();
          newSelection.add(element.id);
        }

        setSelectedElements(newSelection);

        elementStartPositions.current = new Map(
          Array.from(newSelection).map((id) => {
            const el = activeBoard.elements.find((e) => e.id === id);
            return [
              id,
              {
                x: el.x || el.points[0][0],
                y: el.y || el.points[0][1],
                points: el.points?.map((p) => [...p]),
              },
            ];
          })
        );
      } else {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          setSelectedElements(new Set());
          elementStartPositions.current.clear();
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const svgPoint = getSVGPoint(e.clientX, e.clientY);

    if (isMoveIconDragging) {
      const deltaX = svgPoint.x - dragStartPos.current.x;
      const deltaY = svgPoint.y - dragStartPos.current.y;

      setActiveBoardElements((prev) =>
        prev.map((el) => {
          if (!selectedElements.has(el.id)) return el;
          const startPos = elementStartPositions.current.get(el.id);
          if (!startPos) return el;

          if (el.type === "text") {
            return { ...el, x: startPos.x + deltaX, y: startPos.y + deltaY };
          }
          return {
            ...el,
            points: startPos.points.map(([px, py]) => [
              px + deltaX,
              py + deltaY,
            ]),
          };
        })
      );
      return;
    }

    if (isResizingTextBox && textBox) {
      const deltaX = svgPoint.x - resizeStartPos.current.x;
      const deltaY = svgPoint.y - resizeStartPos.current.y;
      setTextBox((prev) => ({
        ...prev,
        width: Math.max(50, prev.width + deltaX),
        height: Math.max(20, prev.height + deltaY),
      }));
      resizeStartPos.current = svgPoint;
      return;
    }

    if (
      mode === "write" &&
      tool === "text" &&
      isDragging &&
      textBox &&
      !isResizingTextBox
    ) {
      const minX = Math.min(dragStartPos.current.x, svgPoint.x);
      const width = Math.max(
        100,
        Math.abs(svgPoint.x - dragStartPos.current.x)
      );
      setTextBox((prev) => ({
        ...prev,
        x: minX,
        width: width,
      }));
    } else if (mode === "write" && drawing && currentPath) {
      setCurrentPath((prev) => ({
        ...prev,
        points: [...prev.points, [svgPoint.x, svgPoint.y]],
      }));
    } else if (mode === "select" && isDragging) {
      const newRect = {
        x1: Math.min(dragStartPos.current.x, svgPoint.x),
        y1: Math.min(dragStartPos.current.y, svgPoint.y),
        x2: Math.max(dragStartPos.current.x, svgPoint.x),
        y2: Math.max(dragStartPos.current.y, svgPoint.y),
      };
      setSelectionRect(newRect);
    }
  };

  const handleMouseUp = () => {
    if (mode === "write" && tool === "text" && textBox) {
      setTextBox((prev) => ({ ...prev, active: true }));
    }
    setIsDragging(false);
    setDrawing(false);
    setIsMoveIconDragging(false);
    setIsResizingTextBox(false);

    if (currentPath) {
      setActiveBoardElements((prev) => [...prev, currentPath]);
      setCurrentPath(null);
    }

    if (mode === "select" && selectionRect) {
      const finalSelection = new Set();
      activeBoard.elements.forEach((element) => {
        if (isElementInSelection(element, selectionRect)) {
          finalSelection.add(element.id);
        }
      });
      setSelectedElements(finalSelection);

      elementStartPositions.current = new Map(
        Array.from(finalSelection).map((id) => {
          const el = activeBoard.elements.find((e) => e.id === id);
          return [
            id,
            {
              x: el.x || el.points[0][0],
              y: el.y || el.points[0][1],
              points: el.points?.map((p) => [...p]),
            },
          ];
        })
      );

      setSelectionRect(null);
    }
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleMouseDown({ ...e, clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMouseMove({ ...e, clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const handleTextChange = (e) => {
    setTextBox((prev) => ({
      ...prev,
      content: e.target.value,
    }));
  };

  const finalizeText = () => {
    if (textBox && textBox.content.trim()) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.font = `${textBox.fontSize}px sans-serif`;
      const measuredWidth = ctx.measureText(textBox.content.trim()).width;

      setActiveBoardElements((prev) => [
        ...prev,
        {
          type: "text",
          x: textBox.x,
          y: textBox.y,
          width: measuredWidth,
          content: textBox.content,
          id: textBox.id,
          color: textColor,
          fontSize: textBox.fontSize,
        },
      ]);
    }
    setTextBox(null);
  };

  const isElementInSelection = (element, rect) => {
    if (!rect) return false;

    if (element.type === "text") {
      const textWidth = element.width || 100;
      const textHeight = element.fontSize || 20;
      return (
        element.x < rect.x2 &&
        element.x + textWidth > rect.x1 &&
        element.y < rect.y2 &&
        element.y + textHeight > rect.y1
      );
    }

    return element.points.some(
      ([x, y]) => x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2
    );
  };

  const deleteElement = () => {
    setActiveBoardElements((prev) =>
      prev.filter((el) => !selectedElements.has(el.id))
    );
    setSelectedElements(new Set());
  };

  const switchToWriteMode = () => {
    setMode("write");
    setSelectedElements(new Set());
  };

  // Helper: create a new board
  const addBoard = () => {
    const newBoard = {
      id: Date.now(),
      name: `Board ${boards.length + 1}`,
      elements: [],
    };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  // Helper: delete a board by its id
  const deleteBoard = (boardId) => {
    setBoards((prevBoards) => {
      if (prevBoards.length === 1) return prevBoards;
      const updatedBoards = prevBoards.filter((board) => board.id !== boardId);
      const renumberedBoards = updatedBoards.map((board, index) => ({
        ...board,
        name: `Board ${index + 1}`,
      }));
      if (boardId === activeBoardId) {
        setActiveBoardId(renumberedBoards[0]?.id || null);
      }
      return renumberedBoards;
    });
  };

  // Focus on the textarea when textBox becomes active.
  useEffect(() => {
    if (textBox?.active && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textBox]);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      } flex flex-col h-screen p-2 overflow-hidden`}
      style={{
        height: "calc(var(--vh, 1vh) * 100)",
        touchAction: "manipulation",
      }}
    >
      <Toolbar
        activeBoard={activeBoard}
        activeBoardId={activeBoardId}
        setActiveBoardId={setActiveBoardId}
        setBoards={setBoards}
        setSelectedElements={setSelectedElements}
        setMode={setMode}
        mode={mode}
        selectedElements={selectedElements}
        deleteElement={deleteElement}
        switchToWriteMode={switchToWriteMode}
        setTool={setTool}
        tool={tool}
        penColor={penColor}
        setPenColor={setPenColor}
        penWidth={penWidth}
        setPenWidth={setPenWidth}
        highlightColor={highlightColor}
        setHighlightColor={setHighlightColor}
        highlightWidth={highlightWidth}
        setHighlightWidth={setHighlightWidth}
        textColor={textColor}
        setTextColor={setTextColor}
        textFontSize={textFontSize}
        setTextFontSize={setTextFontSize}
        textBox={textBox}
        setTextBox={setTextBox}
        handlePdfUpload={handlePdfUpload}
        boards={boards}
        addBoard={addBoard}
        deleteBoard={deleteBoard}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
      />

      {/* Responsive whiteboard container */}
      <div
        className="flex-grow relative overflow-auto"
        style={{ touchAction: "none" }}
      >
        {activeBoard.pdfUrl && (
          <iframe
            src={activeBoard.pdfUrl}
            className="absolute inset-0 w-full h-full border-0 z-20"
            title="PDF Viewer"
          />
        )}
        <svg
          ref={svgRef}
          style={{ touchAction: "none" }}
          className={`absolute inset-0 w-full h-full border ${
            activeBoard.pdfUrl
              ? "pointer-events-none"
              : darkMode
              ? "border-gray-600 bg-gray-800"
              : "border-gray-300 bg-white"
          } z-10`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeBoard.elements.map((element) => (
            <g key={element.id}>
              {element.type === "pen" || element.type === "highlight" ? (
                <>
                  <path
                    d={`M ${element.points
                      .map((p) => p.join(" "))
                      .join(" L ")}`}
                    stroke={element.color}
                    fill="none"
                    strokeWidth={element.strokeWidth}
                    opacity={element.type === "highlight" ? 0.5 : 1}
                    pointerEvents="visibleStroke"
                  />
                  {selectedElements.has(element.id) && (
                    <>
                      <rect
                        x={Math.min(...element.points.map((p) => p[0])) - 5}
                        y={Math.min(...element.points.map((p) => p[1])) - 5}
                        width={
                          Math.max(...element.points.map((p) => p[0])) -
                          Math.min(...element.points.map((p) => p[0])) +
                          10
                        }
                        height={
                          Math.max(...element.points.map((p) => p[1])) -
                          Math.min(...element.points.map((p) => p[1])) +
                          10
                        }
                        fill="none"
                        stroke="#0070f3"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                      <circle
                        cx={Math.max(...element.points.map((p) => p[0])) + 10}
                        cy={Math.min(...element.points.map((p) => p[1])) - 10}
                        r="5"
                        fill="#0070f3"
                        cursor="move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsMoveIconDragging(true);
                          dragStartPos.current = getSVGPoint(
                            e.clientX,
                            e.clientY
                          );
                          elementStartPositions.current = new Map(
                            Array.from(selectedElements).map((id) => {
                              const el = activeBoard.elements.find(
                                (e) => e.id === id
                              );
                              return [
                                id,
                                {
                                  x: el.x || el.points[0][0],
                                  y: el.y || el.points[0][1],
                                  points: el.points?.map((p) => [...p]),
                                },
                              ];
                            })
                          );
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          setIsMoveIconDragging(true);
                          const touch = e.touches[0];
                          dragStartPos.current = getSVGPoint(
                            touch.clientX,
                            touch.clientY
                          );
                          elementStartPositions.current = new Map(
                            Array.from(selectedElements).map((id) => {
                              const el = activeBoard.elements.find(
                                (e) => e.id === id
                              );
                              return [
                                id,
                                {
                                  x: el.x || el.points[0][0],
                                  y: el.y || el.points[0][1],
                                  points: el.points?.map((p) => [...p]),
                                },
                              ];
                            })
                          );
                        }}
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <text
                    x={element.x}
                    y={element.y + element.fontSize}
                    fill={element.color}
                    fontSize={element.fontSize}
                    className="pointer-events-auto"
                  >
                    {element.content}
                  </text>
                  {selectedElements.has(element.id) && (
                    <>
                      <rect
                        x={element.x - 5}
                        y={element.y - 5}
                        width={(element.width || 100) + 10}
                        height={element.fontSize + 10}
                        fill="none"
                        stroke="#0070f3"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                      <circle
                        cx={element.x + (element.width || 100) + 10}
                        cy={element.y - 10}
                        r="5"
                        fill="#0070f3"
                        cursor="move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsMoveIconDragging(true);
                          dragStartPos.current = getSVGPoint(
                            e.clientX,
                            e.clientY
                          );
                          elementStartPositions.current = new Map(
                            Array.from(selectedElements).map((id) => {
                              const el = activeBoard.elements.find(
                                (e) => e.id === id
                              );
                              return [
                                id,
                                {
                                  x: el.x || el.points[0][0],
                                  y: el.y || el.points[0][1],
                                  points: el.points?.map((p) => [...p]),
                                },
                              ];
                            })
                          );
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          setIsMoveIconDragging(true);
                          const touch = e.touches[0];
                          dragStartPos.current = getSVGPoint(
                            touch.clientX,
                            touch.clientY
                          );
                          elementStartPositions.current = new Map(
                            Array.from(selectedElements).map((id) => {
                              const el = activeBoard.elements.find(
                                (e) => e.id === id
                              );
                              return [
                                id,
                                {
                                  x: el.x || el.points[0][0],
                                  y: el.y || el.points[0][1],
                                  points: el.points?.map((p) => [...p]),
                                },
                              ];
                            })
                          );
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </g>
          ))}

          {currentPath && (
            <path
              d={`M ${currentPath.points.map((p) => p.join(" ")).join(" L ")}`}
              stroke={currentPath.color}
              fill="none"
              strokeWidth={currentPath.strokeWidth}
              opacity={currentPath.type === "highlight" ? 0.5 : 1}
            />
          )}

          {selectionRect && (
            <rect
              x={selectionRect.x1}
              y={selectionRect.y1}
              width={selectionRect.x2 - selectionRect.x1}
              height={selectionRect.y2 - selectionRect.y1}
              fill="rgba(0, 112, 243, 0.1)"
              stroke="#0070f3"
              strokeWidth="1"
              strokeDasharray="4 2"
              pointerEvents="none"
            />
          )}

          {textBox && (
            <foreignObject
              x={textBox.x}
              y={textBox.y}
              width={textBox.width}
              height={textBox.height}
              style={{
                overflow: "visible",
                filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                }}
              >
                <textarea
                  ref={textInputRef}
                  value={textBox.content}
                  onChange={handleTextChange}
                  onBlur={() => {
                    if (!isResizingTextBox) finalizeText();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ fontSize: textBox.fontSize, resize: "none" }}
                  className={`w-full h-full border-2 rounded p-2 text-lg outline-none font-sans ${
                    darkMode
                      ? "bg-gray-700 text-white border-gray-500"
                      : "bg-white text-black border-blue-600"
                  }`}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizingTextBox(true);
                    resizeStartPos.current = getSVGPoint(e.clientX, e.clientY);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsResizingTextBox(true);
                    const touch = e.touches[0];
                    resizeStartPos.current = getSVGPoint(
                      touch.clientX,
                      touch.clientY
                    );
                  }}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 15,
                    height: 15,
                    cursor: "nwse-resize",
                    backgroundColor: "#0070f3",
                  }}
                />
              </div>
            </foreignObject>
          )}
        </svg>
      </div>
      <div className="text-center text-xs mt-1">
        Made with ❤️ by{" "}
        <a
          href="https://github.com/Ramy-Ashraf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600"
        >
          Ramy Ashraf
        </a>
      </div>
    </div>
  );
}

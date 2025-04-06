"use client";

import { useState, useRef, useEffect } from "react";
import { LuMove, LuMoveDiagonal2 } from "react-icons/lu";
import Toolbar from "./toolbar";

export default function Whiteboard() {
  // Board management states
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

  // Whiteboard states
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState("write");
  const [tool, setTool] = useState("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#FFFF00");
  const [textColor, setTextColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(6);
  const [highlightWidth, setHighlightWidth] = useState(40);
  // States for line customization
  const [lineColor, setLineColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(6);
  // New states for arrow customization
  const [arrowColor, setArrowColor] = useState("#000000");
  const [arrowWidth, setArrowWidth] = useState(4);
  // New states for ellipse border controls:
  const [circleStrokeColor, setCircleStrokeColor] = useState("#000000");
  const [circleStrokeWidth, setCircleStrokeWidth] = useState(6);
  // Define the ellipse state with separate rx and ry radiuses
  const [currentEllipse, setCurrentEllipse] = useState(null);
  // New state for rounded rectangle border radius control:
  const [roundedRectRadius, setRoundedRectRadius] = useState(10);
  // New state for live drawing of rounded rectangle:
  const [currentRoundedRect, setCurrentRoundedRect] = useState(null);
  // New states for rectangle border controls:
  const [roundedRectColor, setRoundedRectColor] = useState("#000000");
  const [roundedRectStrokeWidth, setRoundedRectStrokeWidth] = useState(6);

  const [selectedElements, setSelectedElements] = useState(new Set());
  const [drawing, setDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [textBox, setTextBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [isMoveIconDragging, setIsMoveIconDragging] = useState(false);
  const [isResizingTextBox, setIsResizingTextBox] = useState(false);
  const [isResizingElement, setIsResizingElement] = useState(false);
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

  // Recording functions
  const startRecording = () => {
    Promise.all([
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }),
      navigator.mediaDevices.getUserMedia({ audio: true }),
    ])
      .then(([displayStream, micStream]) => {
        const tracks = [
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(),
          ...micStream.getAudioTracks(),
        ];
        const combinedStream = new MediaStream(tracks);

        const options = { mimeType: "video/webm" };
        const recorder = new MediaRecorder(combinedStream, options);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          combinedStream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
          recordedChunksRef.current = [];
          const url = URL.createObjectURL(blob);
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

  // Add this helper function at the top level of your component
  const moveIconHandler = (clientX, clientY) => {
    setIsMoveIconDragging(true);
    dragStartPos.current = getSVGPoint(clientX, clientY);
    
    elementStartPositions.current = new Map(
      Array.from(selectedElements).map((id) => {
        const el = activeBoard.elements.find((e) => e.id === id);
        if (!el) return [id, {}];
  
        switch (el.type) {
          case "circle":
            return [id, { center: { ...el.center } }];
          case "roundedRect":
            return [id, { x: el.x, y: el.y }];
          case "line":
          case "arrow":
            return [id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }];
          case "text":
            return [id, { x: el.x, y: el.y }];
          default:
            if (el.points) {
              return [id, { points: el.points.map(p => [...p]) }];
            }
            return [id, {}];
        }
      })
    );
  };

  // Event handlers
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
      } else if (tool === "line" || tool === "arrow") {
        const chosenColor = tool === "line" ? lineColor : arrowColor;
        const chosenWidth = tool === "line" ? lineWidth : arrowWidth;
        setCurrentShape({
          type: tool,
          start: svgPoint,
          end: svgPoint,
          color: chosenColor,
          strokeWidth: chosenWidth,
          id: Date.now(),
        });
        setDrawing(true);
      } else if (tool === "circle") {
        setCurrentEllipse({
          type: "circle",
          center: { ...svgPoint },
          radius: 0,
          color: circleStrokeColor,
          strokeWidth: circleStrokeWidth,
          id: Date.now(),
        });
        setDrawing(true);
      } else if (tool === "roundedRect") {
        // Start a new rounded rectangle
        setCurrentRoundedRect({
          type: "roundedRect",
          x: svgPoint.x,
          y: svgPoint.y,
          width: 0,
          height: 0,
          color: penColor,
          strokeWidth: penWidth,
          rx: roundedRectRadius,
          id: Date.now(),
        });
        setDrawing(true);
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
            if (el.type === "text") {
              return [id, { x: el.x, y: el.y }];
            } else if (el.type === "line" || el.type === "arrow") {
              return [id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }];
            }
            return [
              id,
              {
                points: el.points.map((p) => [...p]),
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

  // Replace the handleMouseMove dragging section with this:
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
  
          switch (el.type) {
            case "circle":
              return {
                ...el,
                center: {
                  x: startPos.center.x + deltaX,
                  y: startPos.center.y + deltaY,
                }
              };
            case "roundedRect":
              return {
                ...el,
                x: startPos.x + deltaX,
                y: startPos.y + deltaY,
              };
            case "line":
            case "arrow":
              return {
                ...el,
                x1: startPos.x1 + deltaX,
                y1: startPos.y1 + deltaY,
                x2: startPos.x2 + deltaX,
                y2: startPos.y2 + deltaY,
              };
            case "text":
              return {
                ...el,
                x: startPos.x + deltaX,
                y: startPos.y + deltaY,
              };
            default:
              if (el.points && startPos.points) {
                return {
                  ...el,
                  points: startPos.points.map(([x, y]) => [
                    x + deltaX,
                    y + deltaY,
                  ]),
                };
              }
              return el;
          }
        })
      );
      return;
    }

    if (isResizingElement) {
      const deltaX = svgPoint.x - resizeStartPos.current.x;
      const deltaY = svgPoint.y - resizeStartPos.current.y;

      setActiveBoardElements((prev) =>
        prev.map((el) => {
          if (!selectedElements.has(el.id)) return el;
          const startData = elementStartPositions.current.get(el.id);
          if (!startData) return el;

          // Special handling for ellipses
          if (el.type === "circle") {
            // Ellipse can get both larger and smaller based on mouse movement
            const startRx = startData.originalRx || startData.originalRadius || el.rx || el.radius || 5;
            const startRy = startData.originalRy || startData.originalRadius || el.ry || el.radius || 5;
            return {
              ...el,
              rx: Math.max(5, startRx + deltaX),
              ry: Math.max(5, startRy + deltaY)
            };
          }

          const {
            originalBoundingBox,
            originalPoints,
            originalFontSize,
            originalWidth,
          } = startData;
          const { minX, minY, maxX, maxY } = originalBoundingBox;
          const originalWidthBB = maxX - minX;
          const originalHeightBB = maxY - minY;

          if (originalWidthBB === 0 || originalHeightBB === 0) return el;

          const newWidthBB = originalWidthBB + deltaX;
          const newHeightBB = originalHeightBB + deltaY;
          const scaleX = newWidthBB / originalWidthBB;
          const scaleY = newHeightBB / originalHeightBB;

          if (el.type === "pen" || el.type === "highlight") {
            const newPoints = originalPoints.map(([x, y]) => [
              minX + (x - minX) * scaleX,
              minY + (y - minY) * scaleY,
            ]);
            return { ...el, points: newPoints };
          } else if (el.type === "text") {
            const newFontSize = originalFontSize * scaleY;
            const newWidth = originalWidth * scaleX;
            return { ...el, fontSize: newFontSize, width: newWidth };
          } else if (el.type === "line" || el.type === "arrow") {
            const newX1 = minX + (startData.x1 - minX) * scaleX;
            const newY1 = minY + (startData.y1 - minY) * scaleY;
            const newX2 = minX + (startData.x2 - minX) * scaleX;
            const newY2 = minY + (startData.y2 - minY) * scaleY;
            return { ...el, x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
          } else if (el.type === "circle") {
            const newRadius = Math.sqrt(
              (svgPoint.x - startData.originalCenter.x) ** 2 +
                (svgPoint.y - startData.originalCenter.y) ** 2
            );
            return { ...el, radius: newRadius };
          } else if (el.type === "roundedRect") {
            const { originalX, originalY, originalWidth, originalHeight } =
              startData;
            return {
              ...el,
              x: originalX,
              y: originalY,
              width: Math.max(
                10,
                originalWidth + (svgPoint.x - resizeStartPos.current.x)
              ),
              height: Math.max(
                10,
                originalHeight + (svgPoint.y - resizeStartPos.current.y)
              ),
              rx: roundedRectRadius,
            };
          }

          return el;
        })
      );
    } else if (isResizingTextBox && textBox) {
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

    if (currentShape && (tool === "line" || tool === "arrow")) {
      setCurrentShape((prev) => ({
        ...prev,
        end: svgPoint,
      }));
      return;
    }

    if (currentEllipse && tool === "circle") {
      // Calculate both x and y radius values separately for ellipse
      const dx = svgPoint.x - currentEllipse.center.x;
      const dy = svgPoint.y - currentEllipse.center.y;
      setCurrentEllipse((prev) => ({
        ...prev,
        // Store separate rx and ry values instead of a single radius
        rx: Math.abs(dx),
        ry: Math.abs(dy),
      }));
      return;
    }

    if (currentRoundedRect && tool === "roundedRect") {
      const newWidth = svgPoint.x - currentRoundedRect.x;
      const newHeight = svgPoint.y - currentRoundedRect.y;
      setCurrentRoundedRect({
        ...currentRoundedRect,
        width: newWidth,
        height: newHeight,
      });
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
    setIsResizingElement(false);

    if (currentPath) {
      setActiveBoardElements((prev) => [...prev, currentPath]);
      setCurrentPath(null);
    }

    if (currentShape) {
      setActiveBoardElements((prev) => [
        ...prev,
        {
          type: currentShape.type,
          x1: currentShape.start.x,
          y1: currentShape.start.y,
          x2: currentShape.end.x,
          y2: currentShape.end.y,
          color: currentShape.color,
          strokeWidth: currentShape.strokeWidth,
          id: currentShape.id,
        },
      ]);
      setCurrentShape(null);
    }

    if (currentEllipse) {
      setActiveBoardElements((prev) => [...prev, currentEllipse]);
      setCurrentEllipse(null);
    }

    if (currentRoundedRect) {
      setActiveBoardElements((prev) => [
        ...prev,
        {
          ...currentRoundedRect,
          // Merge the border properties from the state:
          color: roundedRectColor,
          strokeWidth: roundedRectStrokeWidth,
        },
      ]);
      setCurrentRoundedRect(null);
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
          if (el.type === "text") {
            return [id, { x: el.x, y: el.y }];
          } else if (el.type === "circle") {
            return [id, { center: { ...el.center } }];
          } else if (el.type === "line" || el.type === "arrow") {
            return [id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }];
          }
          return [
            id,
            {
              points: el.points ? el.points.map((p) => [...p]) : [],
            },
          ];
        })
      );

      setSelectionRect(null);
    }
  };

  const handleResizeStart = (e) => {
    if (typeof e.stopPropagation === "function") e.stopPropagation();
    const svgPoint = getSVGPoint(e.clientX, e.clientY);
    setIsResizingElement(true);
    resizeStartPos.current = svgPoint;

    const elementsData = new Map();
    Array.from(selectedElements).forEach((id) => {
      const el = activeBoard.elements.find((el) => el.id === id);
      if (!el) return;

      if (el.type === "circle") {
        // Fix: store bounding box for circle resizing
        const minX = el.center.x - el.radius;
        const maxX = el.center.x + el.radius;
        elementsData.set(el.id, {
          originalBoundingBox: { minX, maxX },
          originalCenter: { ...el.center },
          originalRadius: el.radius,
          originalRx: el.rx,
          originalRy: el.ry,
        });
      } else if (el.type === "text") {
        let minX = el.x,
          minY = el.y;
        let maxX = el.x + (el.width || 100),
          maxY = el.y + (el.fontSize || 20);
        elementsData.set(el.id, {
          originalBoundingBox: { minX, minY, maxX, maxY },
          originalFontSize: el.fontSize,
          originalWidth: el.width,
        });
      } else if (el.type === "line" || el.type === "arrow") {
        let minX = Math.min(el.x1, el.x2);
        let minY = Math.min(el.y1, el.y2);
        let maxX = Math.max(el.x1, el.x2);
        let maxY = Math.max(el.y1, el.y2);
        elementsData.set(el.id, {
          originalBoundingBox: { minX, minY, maxX, maxY },
          x1: el.x1,
          y1: el.y1,
          x2: el.x2,
          y2: el.y2,
        });
      } else if (el.type === "roundedRect") {
        const minX = el.x;
        const minY = el.y;
        const maxX = el.x + el.width;
        const maxY = el.y + el.height;
        elementsData.set(el.id, {
          originalBoundingBox: { minX, minY, maxX, maxY },
          originalX: el.x,
          originalY: el.y,
          originalWidth: el.width,
          originalHeight: el.height,
          originalRx: el.rx,
        });
      } else if (el.points) {
        let minX = Math.min(...el.points.map((p) => p[0]));
        let minY = Math.min(...el.points.map((p) => p[1]));
        let maxX = Math.max(...el.points.map((p) => p[0]));
        let maxY = Math.max(...el.points.map((p) => p[1]));
        elementsData.set(el.id, {
          originalPoints: el.points ? el.points.map((p) => [...p]) : undefined,
          originalBoundingBox: { minX, minY, maxX, maxY },
        });
      }
    });

    elementStartPositions.current = elementsData;
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
    } else if (element.type === "line" || element.type === "arrow") {
      const minX = Math.min(element.x1, element.x2);
      const maxX = Math.max(element.x1, element.x2);
      const minY = Math.min(element.y1, element.y2);
      const maxY = Math.max(element.y1, element.y2);
      return (
        minX < rect.x2 && maxX > rect.x1 && minY < rect.y2 && maxY > rect.y1
      );
    } else if (element.type === "circle") {
      const cx = element.center.x,
        cy = element.center.y,
        rx = element.rx || element.radius,
        ry = element.ry || element.radius;
      
      // Ellipse intersection with rectangle - check if any part of ellipse is in selection rectangle
      return (
        cx + rx >= rect.x1 &&
        cx - rx <= rect.x2 &&
        cy + ry >= rect.y1 &&
        cy - ry <= rect.y2
      );
    } else if (element.type === "roundedRect") {
      // New selection logic for rounded rectangle
      const ex = element.x;
      const ey = element.y;
      const ewidth = element.width;
      const eheight = element.height;
      // Check if bounding boxes intersect
      return (
        ex < rect.x2 &&
        ex + ewidth > rect.x1 &&
        ey < rect.y2 &&
        ey + eheight > rect.y1
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

  const addBoard = () => {
    const newBoard = {
      id: Date.now(),
      name: `Board ${boards.length + 1}`,
      elements: [],
    };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  };

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
        lineColor={lineColor}
        setLineColor={setLineColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        arrowColor={arrowColor}
        setArrowColor={setArrowColor}
        arrowWidth={arrowWidth}
        setArrowWidth={setArrowWidth}
        // Pass new circle control props:
        circleStrokeColor={circleStrokeColor}
        setCircleStrokeColor={setCircleStrokeColor}
        circleStrokeWidth={circleStrokeWidth}
        setCircleStrokeWidth={setCircleStrokeWidth}
        // Pass new rounded rectangle control props:
        roundedRectRadius={roundedRectRadius}
        setRoundedRectRadius={setRoundedRectRadius}
        // Pass new rectangle border control props:
        roundedRectColor={roundedRectColor}
        setRoundedRectColor={setRoundedRectColor}
        roundedRectStrokeWidth={roundedRectStrokeWidth}
        setRoundedRectStrokeWidth={setRoundedRectStrokeWidth}
      />

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
          {/* Add arrowhead marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="7"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M1,1 L9,5 L1,9"
                fill="none"
                stroke="context-stroke"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>

          {/* Draw base elements without overlays */}
          {activeBoard.elements.map((element) => (
            <g key={element.id}>
              {element.type === "pen" || element.type === "highlight" ? (
                <path
                  d={`M ${element.points.map((p) => p.join(" ")).join(" L ")}`}
                  stroke={element.color}
                  fill="none"
                  strokeWidth={element.strokeWidth}
                  opacity={element.type === "highlight" ? 0.5 : 1}
                  pointerEvents="visibleStroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : element.type === "text" ? (
                <text
                  x={`${element.x}`}
                  y={`${element.y + element.fontSize}`}
                  fill={element.color}
                  fontSize={`${element.fontSize}`}
                  className="pointer-events-auto"
                >
                  {element.content}
                </text>
              ) : element.type === "line" || element.type === "arrow" ? (
                <line
                  x1={`${element.x1}`}
                  y1={`${element.y1}`}
                  x2={`${element.x2}`}
                  y2={`${element.y2}`}
                  stroke={element.color}
                  strokeWidth={`${element.strokeWidth}`}
                  markerEnd={
                    element.type === "arrow" ? "url(#arrowhead)" : undefined
                  }
                />
              ) : element.type === "circle" ? (
                <ellipse
                  cx={`${element.center.x}`}
                  cy={`${element.center.y}`}
                  rx={`${element.rx || element.radius}`}
                  ry={`${element.ry || element.radius}`}
                  stroke={element.color}
                  strokeWidth={`${element.strokeWidth}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : element.type === "roundedRect" ? (
                <rect
                  x={element.x}
                  y={element.y}
                  width={element.width}
                  height={element.height}
                  rx={element.rx}
                  ry={element.rx}
                  stroke={element.color}
                  strokeWidth={element.strokeWidth}
                  fill="none"
                />
              ) : null}
            </g>
          ))}

          {/* Draw selection overlays on top */}
          {activeBoard.elements
            .filter((element) => selectedElements.has(element.id))
            .map((element) => {
              if (element.type === "pen" || element.type === "highlight") {
                const minX = Math.min(...element.points.map((p) => p[0]));
                const minY = Math.min(...element.points.map((p) => p[1]));
                const maxX = Math.max(...element.points.map((p) => p[0]));
                const maxY = Math.max(...element.points.map((p) => p[1]));
                return (
                  <g key={`${element.id}-overlay`}>
                    <rect
                      x={`${minX - 5}`}
                      y={`${minY - 5}`}
                      width={`${maxX - minX + 10}`}
                      height={`${maxY - minY + 10}`}
                      fill="none"
                      stroke="#0070f3"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    {/* Move icon */}
                    <g
                      transform={`translate(${maxX + 10}, ${minY - 10})`}
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        moveIconHandler(e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        moveIconHandler(touch.clientX, touch.clientY);
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#0070f3" size={20} />
                      </g>
                    </g>
                    {/* Resize icon */}
                    <g
                      transform={`translate(${maxX + 10}, ${maxY + 10})`}
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => handleResizeStart(e, element)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleResizeStart(
                          {
                            ...e,
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                          },
                          element
                        );
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#0070f3" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "text") {
                return (
                  <g key={`${element.id}-overlay`}>
                    <rect
                      x={`${element.x - 5}`}
                      y={`${element.y - 5}`}
                      width={`${(element.width || 100) + 10}`}
                      height={`${(element.fontSize || 20) + 10}`}
                      fill="none"
                      stroke="#0070f3"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    {/* Move icon */}
                    <g
                      transform={`translate(${
                        element.x + (element.width || 100) + 10
                      }, ${element.y - 10})`}
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        moveIconHandler(e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        moveIconHandler(touch.clientX, touch.clientY);
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#0070f3" size={20} />
                      </g>
                    </g>
                    {/* Resize icon */}
                    <g
                      transform={`translate(${
                        element.x + (element.width || 100) + 10
                      }, ${element.y + (element.fontSize || 20) + 10})`}
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => handleResizeStart(e, element)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleResizeStart(
                          {
                            ...e,
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                          },
                          element
                        );
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#0070f3" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "line" || element.type === "arrow") {
                return (
                  <g key={`${element.id}-overlay`}>
                    <rect
                      x={`${Math.min(element.x1, element.x2) - 5}`}
                      y={`${Math.min(element.y1, element.y2) - 5}`}
                      width={`${Math.abs(element.x2 - element.x1) + 10}`}
                      height={`${Math.abs(element.y2 - element.y1) + 10}`}
                      fill="none"
                      stroke="#0070f3"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    {/* Move icon */}
                    <g
                      transform={`translate(${
                        Math.max(element.x1, element.x2) + 10
                      }, ${Math.min(element.y1, element.y2) - 10})`}
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        moveIconHandler(e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        moveIconHandler(touch.clientX, touch.clientY);
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#0070f3" size={20} />
                      </g>
                    </g>
                    {/* Resize icon */}
                    <g
                      transform={`translate(${
                        Math.max(element.x1, element.x2) + 10
                      }, ${Math.max(element.y1, element.y2) + 10})`}
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => handleResizeStart(e, element)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleResizeStart(
                          {
                            ...e,
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                          },
                          element
                        );
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#0070f3" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "circle") {
                const cx = element.center.x,
                  cy = element.center.y,
                  rx = element.rx || element.radius,
                  ry = element.ry || element.radius;
                return (
                  <g key={`${element.id}-overlay`}>
                    <rect
                      x={`${cx - rx - 5}`}
                      y={`${cy - ry - 5}`}
                      width={`${2 * rx + 10}`}
                      height={`${2 * ry + 10}`}
                      fill="none"
                      stroke="#0070f3"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    {/* Move icon */}
                    <g
                      transform={`translate(${cx + rx + 10}, ${cy - ry - 10})`}
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        moveIconHandler(e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        moveIconHandler(touch.clientX, touch.clientY);
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#0070f3" size={20} />
                      </g>
                    </g>
                    {/* Resize icon */}
                    <g
                      transform={`translate(${cx + rx + 10}, ${cy + ry + 10})`}
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleResizeStart(e);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleResizeStart({
                          ...e,
                          clientX: touch.clientX,
                          clientY: touch.clientY,
                        });
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#0070f3" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "roundedRect") {
                // New overlay for rounded rectangle
                return (
                  <g
                    key={`${element.id}-overlay`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      moveIconHandler(e.clientX, e.clientY);
                    }}
                  >
                    <rect
                      x={element.x - 5}
                      y={element.y - 5}
                      width={element.width + 10}
                      height={element.height + 10}
                      fill="none"
                      stroke="#0070f3"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    {/* Move icon */}
                    <g
                      transform={`translate(${
                        element.x + element.width + 10
                      }, ${element.y - 10})`}
                      style={{ cursor: "move" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        moveIconHandler(e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        moveIconHandler(touch.clientX, touch.clientY);
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#0070f3" size={20} />
                      </g>
                    </g>
                    {/* Resize icon */}
                    <g
                      transform={`translate(${
                        element.x + element.width + 10
                      }, ${element.y + element.height + 10})`}
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => handleResizeStart(e, element)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        handleResizeStart(
                          {
                            ...e,
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                          },
                          element
                        );
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r="12"
                        fill="white"
                        stroke="#0070f3"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#0070f3" size={20} />
                      </g>
                    </g>
                  </g>
                );
              }
            })}

          {/* Draw current drawing path (during live drawing) */}
          {currentPath && (
            <path
              d={`M ${currentPath.points.map((p) => p.join(" ")).join(" L ")}`}
              stroke={currentPath.color}
              fill="none"
              strokeWidth={currentPath.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={currentPath.type === "highlight" ? 0.5 : 1}
            />
          )}

          {/* Draw current shape preview */}
          {currentShape && (
            <line
              x1={`${currentShape.start.x}`}
              y1={`${currentShape.start.y}`}
              x2={`${currentShape.end.x}`}
              y2={`${currentShape.end.y}`}
              stroke={currentShape.color}
              strokeWidth={`${currentShape.strokeWidth}`}
              markerEnd={
                currentShape.type === "arrow" ? "url(#arrowhead)" : undefined
              }
            />
          )}

          {/* Draw current ellipse preview */}
          {currentEllipse && (
            <ellipse
              cx={`${currentEllipse.center.x}`}
              cy={`${currentEllipse.center.y}`}
              rx={`${currentEllipse.rx}`}
              ry={`${currentEllipse.ry}`}
              stroke={currentEllipse.color}
              strokeWidth={`${currentEllipse.strokeWidth}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Draw live preview for currentRoundedRect */}
          {currentRoundedRect && tool === "roundedRect" && (
            <rect
              x={currentRoundedRect.x}
              y={currentRoundedRect.y}
              width={currentRoundedRect.width}
              height={currentRoundedRect.height}
              rx={currentRoundedRect.rx}
              ry={currentRoundedRect.rx}
              stroke={roundedRectColor}
              strokeWidth={roundedRectStrokeWidth}
              fill="none"
            />
          )}

          {/* Draw selection rectangle */}
          {selectionRect && (
            <rect
              x={`${selectionRect.x1}`}
              y={`${selectionRect.y1}`}
              width={`${selectionRect.x2 - selectionRect.x1}`}
              height={`${selectionRect.y2 - selectionRect.y1}`}
              fill="rgba(0, 112, 243, 0.1)"
              stroke="#0070f3"
              strokeWidth="1"
              strokeDasharray="4 2"
              pointerEvents="none"
            />
          )}

          {/* Render text input box */}
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

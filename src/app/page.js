"use client";

import { useState, useRef, useEffect, memo } from "react";
import { LuMove, LuMoveDiagonal2 } from "react-icons/lu";
import Toolbar from "@/components/toolbar";
import { cn } from "@/lib/utils";
// Import react-pdf components
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set the worker source outside of the component
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function Whiteboard() {
  // Board management states
  const [boards, setBoards] = useState([
    { id: 1, name: "Board 1", elements: [], pdfUrl: null },
    { id: 2, name: "Board 2", elements: [], pdfUrl: null },
  ]);
  const [activeBoardId, setActiveBoardId] = useState(1);
  const activeBoard = boards.find((b) => b.id === activeBoardId) || {
    elements: [],
    pdfUrl: null, // Ensure pdfUrl exists even if board is not found initially
  };

  // Zoom and pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleZoom = (delta, clientX, clientY) => {
    const scaleFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.1), 5);

    // Calculate mouse position relative to SVG
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = clientX - svgRect.left;
    const mouseY = clientY - svgRect.top;

    // Calculate new pan position to zoom towards mouse
    const newPan = {
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    };

    setZoom(newZoom);
    setPan(newPan);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(-e.deltaY, e.clientX, e.clientY);
    }
  };

  // Fix the startPanning function to work in all modes
  const startPanning = (e, clientX, clientY) => {
    if ((e && e.buttons === 2) || (e && e.buttons === 1 && e.altKey)) {
      setIsPanning(true);
      lastMousePos.current = { x: clientX, y: clientY };
    }
  };

  const handlePan = (clientX, clientY) => {
    if (isPanning) {
      const dx = clientX - lastMousePos.current.x;
      const dy = clientY - lastMousePos.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: clientX, y: clientY };
    }
  };

  const stopPanning = () => {
    setIsPanning(false);
  };

  // Close PDF function
  const closePdf = () => {
    setBoards((prevBoards) =>
      prevBoards.map((board) =>
        board.id === activeBoardId ? { ...board, pdfUrl: null } : board
      )
    );
    setPageNumber(1);
    setNumPages(null);
    setPdfDimensions({ width: 0, height: 0 });
  };

  // Add useEffect for wheel event with proper cleanup
  useEffect(() => {
    const wheelHandler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const cleanupPdfWorker = () => {
      if (pdfjs.GlobalWorkerOptions.workerSrc) {
        // Cleanup PDF.js worker
        pdfjs.GlobalWorkerOptions.workerSrc = null;
      }
    };

    document.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      document.removeEventListener("wheel", wheelHandler);
      cleanupPdfWorker();
    };
  }, []);

  // Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const recordedChunksRef = useRef([]);

  // Tool states
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState("write");
  const [tool, setTool] = useState("pen");

  // Colors and widths for different tools
  const [penProps, setPenProps] = useState({ color: "#6d28d9", width: 6 });
  const [highlightProps, setHighlightProps] = useState({
    color: "#fef08a",
    width: 40,
  });
  const [lineProps, setLineProps] = useState({ color: "#6d28d9", width: 6 });
  const [arrowProps, setArrowProps] = useState({ color: "#6d28d9", width: 4 });
  const [textProps, setTextProps] = useState({
    color: "#6d28d9",
    fontSize: 25,
  });
  const [roundedRectProps, setRoundedRectProps] = useState({
    color: "#6d28d9",
    strokeWidth: 6,
    radius: 10,
  });
  const [ellipseProps, setEllipseProps] = useState({
    color: "#6d28d9",
    strokeWidth: 6,
  });

  // Drawing states
  const [selectedElements, setSelectedElements] = useState(new Set());
  const [drawing, setDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [currentEllipse, setCurrentEllipse] = useState(null);
  const [currentRoundedRect, setCurrentRoundedRect] = useState(null);
  const [textBox, setTextBox] = useState(null);

  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [isMoveIconDragging, setIsMoveIconDragging] = useState(false);
  const [isResizingTextBox, setIsResizingTextBox] = useState(false);
  const [isResizingElement, setIsResizingElement] = useState(false);

  // Refs
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

  // PDF state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

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
      setMode("select"); // Switch to select mode when PDF is loaded
      setPageNumber(1);
      setNumPages(null);
      setPdfDimensions({ width: 0, height: 0 });
    }
  };

  // Add image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      // Default size for image
      const defaultWidth = 200;
      const defaultHeight = 150;
      setActiveBoardElements((prev) => [
        ...prev,
        {
          type: "image",
          x: 100,
          y: 100,
          width: defaultWidth,
          height: defaultHeight,
          url,
          id: Date.now(),
        },
      ]);
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
          a.download = "whiteboard-recording.webm";
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

    // Allow PDF movement in select mode
    if (activeBoard.pdfUrl && mode === "select") {
      elementStartPositions.current = new Map([
        ["pdf", { x: pan.x, y: pan.y }],
      ]);
      return;
    }

    elementStartPositions.current = new Map(
      Array.from(selectedElements).map((id) => {
        const el = activeBoard.elements.find((e) => e.id === id);
        if (!el) return [id, {}];

        switch (el.type) {
          case "ellipse":
            return [id, { center: { ...el.center } }];
          case "roundedRect":
            return [id, { x: el.x, y: el.y }];
          case "line":
          case "arrow":
            return [id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }];
          case "text":
            return [id, { x: el.x, y: el.y }];
          case "image":
            return [id, { x: el.x, y: el.y }];
          default:
            if (el.points) {
              return [id, { points: el.points.map((p) => [...p]) }];
            }
            return [id, {}];
        }
      })
    );
  };

  // Event handlers
  const handleMouseDown = (e) => {
    const svgPoint = getSVGPoint(e.clientX, e.clientY);

    // Allow zooming regardless of mode
    if (e.buttons === 2 || (e.buttons === 1 && e.altKey)) {
      startPanning(e, e.clientX, e.clientY);
      return;
    }

    if (mode === "write") {
      if (tool === "pen" || tool === "highlight") {
        const chosenProps = tool === "pen" ? penProps : highlightProps;
        setCurrentPath({
          type: tool,
          points: [[svgPoint.x, svgPoint.y]],
          color: chosenProps.color,
          strokeWidth: chosenProps.width,
          id: Date.now(),
        });
        setDrawing(true);
      } else if (tool === "text") {
        dragStartPos.current = svgPoint;
        setTextBox({
          x: svgPoint.x,
          y: svgPoint.y,
          width: 100,
          height: textProps.fontSize * 2,
          content: "",
          id: Date.now(),
          active: false,
          fontSize: textProps.fontSize,
        });
        setIsDragging(true);
      } else if (tool === "line" || tool === "arrow") {
        const chosenProps = tool === "line" ? lineProps : arrowProps;
        setCurrentShape({
          type: tool,
          start: svgPoint,
          end: svgPoint,
          color: chosenProps.color,
          strokeWidth: chosenProps.width,
          id: Date.now(),
        });
        setDrawing(true);
      } else if (tool === "circle") {
        setCurrentEllipse({
          type: "ellipse",
          center: { ...svgPoint },
          radius: 0,
          color: ellipseProps.color,
          strokeWidth: ellipseProps.strokeWidth,
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
          color: roundedRectProps.color,
          strokeWidth: roundedRectProps.strokeWidth,
          rx: roundedRectProps.radius,
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
            } else if (el.type === "ellipse") {
              return [id, { center: { ...el.center } }];
            } else if (el.type === "line" || el.type === "arrow") {
              return [id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }];
            } else if (el.type === "roundedRect") {
              return [id, { x: el.x, y: el.y }];
            } else if (el.type === "image") {
              return [id, { x: el.x, y: el.y }];
            }
            return [
              id,
              {
                points: el.points?.map((p) => [...p]) || [],
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

      // Handle PDF movement in select mode
      if (activeBoard.pdfUrl && mode === "select") {
        const startPos = elementStartPositions.current.get("pdf");
        if (startPos) {
          setPan({
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          });
        }
        return;
      }

      setActiveBoardElements((prev) =>
        prev.map((el) => {
          if (!selectedElements.has(el.id)) return el;

          const startPos = elementStartPositions.current.get(el.id);
          if (!startPos) return el;

          switch (el.type) {
            case "ellipse":
              return {
                ...el,
                center: {
                  x: startPos.center.x + deltaX,
                  y: startPos.center.y + deltaY,
                },
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
            case "image":
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
          if (el.type === "ellipse") {
            // Ellipse can get both larger and smaller based on mouse movement
            const startRx =
              startData.originalRx ||
              startData.originalRadius ||
              el.rx ||
              el.radius ||
              5;
            const startRy =
              startData.originalRy ||
              startData.originalRadius ||
              el.ry ||
              el.radius ||
              5;
            return {
              ...el,
              rx: Math.max(5, startRx + deltaX),
              ry: Math.max(5, startRy + deltaY),
            };
          }

          const {
            originalBoundingBox,
            originalPoints,
            originalFontSize,
            originalWidth,
          } = startData;
          const { minX, minY, maxX, maxY } = originalBoundingBox || {};

          if (originalBoundingBox && (maxX - minX === 0 || maxY - minY === 0))
            return el;

          if (originalBoundingBox) {
            const originalWidthBB = maxX - minX;
            const originalHeightBB = maxY - minY;
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
            }
          }

          if (el.type === "ellipse" && startData.originalCenter) {
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
              rx: roundedRectProps.radius,
            };
          } else if (el.type === "image") {
            return {
              ...el,
              width: Math.max(10, (startData.width || el.width) + deltaX),
              height: Math.max(10, (startData.height || el.height) + deltaY),
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
      // Calculate the width and height, ensuring they're positive
      const width = svgPoint.x - currentRoundedRect.x;
      const height = svgPoint.y - currentRoundedRect.y;

      // Determine actual x, y, width, and height based on drawing direction
      let newX = currentRoundedRect.x;
      let newY = currentRoundedRect.y;
      let newWidth = width;
      let newHeight = height;

      // Adjust for negative width (drawing from right to left)
      if (width < 0) {
        newX = currentRoundedRect.x + width;
        newWidth = Math.abs(width);
      }

      // Adjust for negative height (drawing from bottom to top)
      if (height < 0) {
        newY = currentRoundedRect.y + height;
        newHeight = Math.abs(height);
      }

      setCurrentRoundedRect({
        ...currentRoundedRect,
        displayX: newX,
        displayY: newY,
        displayWidth: newWidth,
        displayHeight: newHeight,
        width,
        height,
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
      // Calculate the actual coordinates and dimensions for the rectangle
      const width = Math.abs(currentRoundedRect.width);
      const height = Math.abs(currentRoundedRect.height);
      const x =
        currentRoundedRect.width < 0
          ? currentRoundedRect.x + currentRoundedRect.width
          : currentRoundedRect.x;
      const y =
        currentRoundedRect.height < 0
          ? currentRoundedRect.y + currentRoundedRect.height
          : currentRoundedRect.y;

      setActiveBoardElements((prev) => [
        ...prev,
        {
          ...currentRoundedRect,
          x: x,
          y: y,
          width: width,
          height: height,
          // Merge the border properties from the state:
          color: roundedRectProps.color,
          strokeWidth: roundedRectProps.strokeWidth,
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
          } else if (el.type === "ellipse") {
            return [id, { center: { ...el.center } }];
          } else if (el.type === "line" || el.type === "arrow") {
            return [id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }];
          } else if (el.type === "roundedRect") {
            return [id, { x: el.x, y: el.y }];
          } else if (el.type === "image") {
            return [id, { x: el.x, y: el.y }];
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

      if (el.type === "ellipse") {
        // Fix: store bounding box for ellipse resizing
        const minX = el.center.x - (el.rx || el.radius);
        const maxX = el.center.x + (el.rx || el.radius);
        const minY = el.center.y - (el.ry || el.radius);
        const maxY = el.center.y + (el.ry || el.radius);
        elementsData.set(el.id, {
          originalBoundingBox: { minX, minY, maxX, maxY },
          originalCenter: { ...el.center },
          originalRadius: el.radius,
          originalRx: el.rx,
          originalRy: el.ry,
        });
      } else if (el.type === "text") {
        const minX = el.x,
          minY = el.y;
        const maxX = el.x + (el.width || 100),
          maxY = el.y + (el.fontSize || 20);
        elementsData.set(el.id, {
          originalBoundingBox: { minX, minY, maxX, maxY },
          originalFontSize: el.fontSize,
          originalWidth: el.width,
        });
      } else if (el.type === "line" || el.type === "arrow") {
        const minX = Math.min(el.x1, el.x2);
        const minY = Math.min(el.y1, el.y2);
        const maxX = Math.max(el.x1, el.x2);
        const maxY = Math.max(el.y1, el.y2);
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
        const minX = Math.min(...el.points.map((p) => p[0]));
        const minY = Math.min(...el.points.map((p) => p[1]));
        const maxX = Math.max(...el.points.map((p) => p[0]));
        const maxY = Math.max(...el.points.map((p) => p[1]));
        elementsData.set(el.id, {
          originalPoints: el.points ? el.points.map((p) => [...p]) : undefined,
          originalBoundingBox: { minX, minY, maxX, maxY },
        });
      } else if (el.type === "image") {
        elementsData.set(el.id, {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
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
          color: textProps.color,
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
    } else if (element.type === "ellipse") {
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
    } else if (element.type === "image") {
      return (
        element.x < rect.x2 &&
        element.x + element.width > rect.x1 &&
        element.y < rect.y2 &&
        element.y + element.height > rect.y1
      );
    }
    return element.points?.some(
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

  // Define control button styles
  const controlButtonStyle = cn(
    "flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all duration-150",
    darkMode
      ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700"
      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
  );

  // PDF Load Success Handler
  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    setPageNumber(1); // Reset to first page on new load
  };

  // PDF Page Load Success Handler (to get dimensions)
  const onPageLoadSuccess = (page) => {
    // Use viewport dimensions for initial sizing
    setPdfDimensions({ width: page.view[2], height: page.view[3] });
  };

  // Create a zoom button component
  const ZoomControls = memo(({ zoom, setZoom, setPan, darkMode }) => (
    <div
      className={cn(
        "fixed left-4 bottom-20 z-30 flex flex-col gap-2 p-2 rounded-lg shadow-lg backdrop-blur-sm",
        darkMode
          ? "bg-gray-900/70 border border-gray-800"
          : "bg-white/70 border border-gray-200"
      )}
    >
      <button
        onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
        className={controlButtonStyle}
        title="Zoom In"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4V20M4 12H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div
        className={cn(
          "text-center text-xs font-medium px-2 py-1 rounded",
          darkMode ? "text-gray-300 bg-gray-800" : "text-gray-600 bg-gray-100"
        )}
      >
        {Math.round(zoom * 100)}%
      </div>
      <button
        onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
        className={controlButtonStyle}
        title="Zoom Out"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        onClick={() => {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }}
        className={controlButtonStyle}
        title="Reset Zoom"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 8V16M8 12H16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  ));

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen w-screen overflow-hidden font-sans",
        darkMode
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100"
          : "bg-gradient-to-br from-white via-gray-100 to-gray-200 text-gray-900"
      )}
      style={{
        height: "100dvh",
        minHeight: 0,
        minWidth: 0,
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
        penProps={penProps}
        setPenProps={setPenProps}
        highlightProps={highlightProps}
        setHighlightProps={setHighlightProps}
        textProps={textProps}
        setTextProps={setTextProps}
        textBox={textBox}
        setTextBox={setTextBox}
        handlePdfUpload={handlePdfUpload}
        handleImageUpload={handleImageUpload}
        boards={boards}
        addBoard={addBoard}
        deleteBoard={deleteBoard}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        lineProps={lineProps}
        setLineProps={setLineProps}
        arrowProps={arrowProps}
        setArrowProps={setArrowProps}
        roundedRectProps={roundedRectProps}
        setRoundedRectProps={setRoundedRectProps}
        ellipseProps={ellipseProps}
        setEllipseProps={setEllipseProps}
        // PDF props for Toolbar
        numPages={numPages}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        pdfUrl={activeBoard.pdfUrl}
        zoom={zoom}
        setZoom={setZoom}
        closePdf={closePdf}
      />

      <main
        className="flex-grow relative w-full h-full overflow-hidden"
        style={{ minHeight: 0, minWidth: 0, touchAction: "none" }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          handleMouseDown(e);
          startPanning(e, e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handlePan(e.clientX, e.clientY);
        }}
        onMouseUp={(e) => {
          handleMouseUp();
          stopPanning();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Remove the iframe */}
        {/* Render PDF using react-pdf if pdfUrl exists */}
        {activeBoard.pdfUrl && (
          <div
            className="absolute inset-0 w-full h-full z-0 pointer-events-none flex items-center justify-center"
            style={{
              // Adjust background based on dark mode if needed
              backgroundColor: darkMode
                ? "rgb(17 24 39 / var(--tw-bg-opacity))"
                : "white",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <Document
              file={activeBoard.pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={console.error}
              className="flex items-center justify-center w-full h-full overflow-hidden"
            >
              <Page
                pageNumber={pageNumber}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false} // Disable text layer if not needed for drawing
                renderAnnotationLayer={false} // Disable annotation layer
                // Scale page to fit container while maintaining aspect ratio
                width={
                  pdfDimensions.width > 0
                    ? Math.min(window.innerWidth * 0.9, pdfDimensions.width)
                    : undefined
                }
                height={
                  pdfDimensions.height > 0
                    ? Math.min(window.innerHeight * 0.9, pdfDimensions.height)
                    : undefined
                }
                className="shadow-lg"
              />
            </Document>
          </div>
        )}
        <svg
          ref={svgRef}
          style={{
            touchAction: "none",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          className={cn(
            "absolute inset-0 w-full h-full z-10 select-none transition-colors duration-300",
            // Make SVG background transparent when PDF is shown, allow pointer events
            activeBoard.pdfUrl
              ? "bg-transparent pointer-events-auto"
              : darkMode
              ? "bg-gray-900 border border-gray-800 pointer-events-auto"
              : "bg-white border border-gray-200 pointer-events-auto"
          )}
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
          {activeBoard.elements.map((element, index) => (
            <g key={`${element.id}-${index}`}>
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
              ) : element.type === "ellipse" ? (
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
              ) : element.type === "image" ? (
                <image
                  x={element.x}
                  y={element.y}
                  width={element.width}
                  height={element.height}
                  href={element.url}
                  style={{ pointerEvents: "auto" }}
                />
              ) : null}
            </g>
          ))}

          {/* Draw selection overlays on top */}
          {activeBoard.elements
            .filter((element) => selectedElements.has(element.id))
            .map((element, index) => {
              // Update overlays for a more modern look
              if (element.type === "pen" || element.type === "highlight") {
                const minX = Math.min(...element.points.map((p) => p[0]));
                const minY = Math.min(...element.points.map((p) => p[1]));
                const maxX = Math.max(...element.points.map((p) => p[0]));
                const maxY = Math.max(...element.points.map((p) => p[1]));
                return (
                  <g key={`${element.id}-overlay-${index}`}>
                    <rect
                      x={`${minX - 5}`}
                      y={`${minY - 5}`}
                      width={`${maxX - minX + 10}`}
                      height={`${maxY - minY + 10}`}
                      fill="none"
                      stroke="#6d28d9"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#6d28d9" size={20} />
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#6d28d9" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "text") {
                return (
                  <g key={`${element.id}-overlay-${index}`}>
                    <rect
                      x={`${element.x - 5}`}
                      y={`${element.y - 5}`}
                      width={`${(element.width || 100) + 10}`}
                      height={`${(element.fontSize || 20) + 10}`}
                      fill="none"
                      stroke="#6d28d9"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#6d28d9" size={20} />
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#6d28d9" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "line" || element.type === "arrow") {
                return (
                  <g key={`${element.id}-overlay-${index}`}>
                    <rect
                      x={`${Math.min(element.x1, element.x2) - 5}`}
                      y={`${Math.min(element.y1, element.y2) - 5}`}
                      width={`${Math.abs(element.x2 - element.x1) + 10}`}
                      height={`${Math.abs(element.y2 - element.y1) + 10}`}
                      fill="none"
                      stroke="#6d28d9"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#6d28d9" size={20} />
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#6d28d9" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "ellipse") {
                const cx = element.center.x,
                  cy = element.center.y,
                  rx = element.rx || element.radius,
                  ry = element.ry || element.radius;
                return (
                  <g key={`${element.id}-overlay-${index}`}>
                    <rect
                      x={`${cx - rx - 5}`}
                      y={`${cy - ry - 5}`}
                      width={`${2 * rx + 10}`}
                      height={`${2 * ry + 10}`}
                      fill="none"
                      stroke="#6d28d9"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#6d28d9" size={20} />
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#6d28d9" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "roundedRect") {
                // New overlay for rounded rectangle
                return (
                  <g
                    key={`${element.id}-overlay-${index}`}
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
                      stroke="#6d28d9"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#6d28d9" size={20} />
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#6d28d9" size={20} />
                      </g>
                    </g>
                  </g>
                );
              } else if (element.type === "image") {
                return (
                  <g key={`${element.id}-overlay-${index}`}>
                    <rect
                      x={element.x - 5}
                      y={element.y - 5}
                      width={element.width + 10}
                      height={element.height + 10}
                      fill="none"
                      stroke="#6d28d9"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMove color="#6d28d9" size={20} />
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
                        stroke="#6d28d9"
                        strokeWidth="2"
                      />
                      <g transform="translate(-10, -10)">
                        <LuMoveDiagonal2 color="#6d28d9" size={20} />
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
              x={currentRoundedRect.displayX}
              y={currentRoundedRect.displayY}
              width={currentRoundedRect.displayWidth}
              height={currentRoundedRect.displayHeight}
              rx={currentRoundedRect.rx}
              ry={currentRoundedRect.rx}
              stroke={roundedRectProps.color}
              strokeWidth={roundedRectProps.strokeWidth}
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
              fill="rgba(109, 40, 217, 0.08)"
              stroke="#6d28d9"
              strokeWidth="2"
              strokeDasharray="6 3"
              style={{ filter: "drop-shadow(0 0 6px #6d28d9aa)" }}
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
                  className={cn(
                    "w-full h-full border-2 rounded p-2 text-lg outline-none font-sans",
                    darkMode
                      ? "bg-gray-800 text-white border-violet-600"
                      : "bg-white text-black border-violet-600"
                  )}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  placeholder="Type here..."
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
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-violet-600 rounded-bl"
                />
              </div>
            </foreignObject>
          )}
        </svg>
      </main>

      {/* Add zoom controls that are always visible regardless of mode */}
      <ZoomControls
        zoom={zoom}
        setZoom={setZoom}
        setPan={setPan}
        darkMode={darkMode}
      />

      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-xs font-medium opacity-80 select-none z-30">
        Made with <span className="text-pink-500">❤️</span> by{" "}
        <a
          href="https://github.com/Ramy-Ashraf"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "underline hover:text-violet-700 pointer-events-auto",
            darkMode ? "text-violet-400" : "text-violet-600"
          )}
        >
          Ramy Ashraf
        </a>
      </footer>
    </div>
  );
}

"use client";

import { useState, memo, useMemo } from "react";
import {
  LuPenTool,
  LuMousePointer,
  LuX,
  LuBrush,
  LuType,
  LuUpload,
  LuTrash,
  LuMoon,
  LuSun,
  LuHighlighter,
  LuCircle,
  LuSquare,
  LuChevronDown,
  LuSlash,
  LuArrowRight,
  LuPlus,
  LuVideo,
  LuVideoOff,
  LuLayers,
  LuImage,
  LuChevronLeft,
  LuChevronRight,
  LuSave,
} from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Memoize ToolbarButton component
const ToolbarButton = memo(
  ({ onClick, title, icon: Icon, isActive, darkMode, className, disabled }) => {
    const buttonStyle = useMemo(
      () =>
        cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
          isActive
            ? "bg-gradient-to-br from-violet-600 to-violet-800 text-white scale-105 shadow-lg shadow-violet-500/20"
            : darkMode
            ? "bg-gray-800/80 text-gray-200 hover:bg-gray-700 border border-gray-700"
            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm",
          className
        ),
      [isActive, darkMode, className]
    );

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title={title}
        className={buttonStyle}
        tabIndex={0}
        disabled={disabled}
      >
        <Icon size={20} />
      </motion.button>
    );
  }
);

ToolbarButton.displayName = "ToolbarButton";

// Main component
const Toolbar = ({
  activeBoard,
  activeBoardId,
  setActiveBoardId,
  setBoards,
  setSelectedElements,
  setMode,
  mode,
  selectedElements,
  deleteElement,
  switchToWriteMode,
  setTool,
  tool,
  penProps,
  setPenProps,
  highlightProps,
  setHighlightProps,
  textProps,
  setTextProps,
  textBox,
  setTextBox,
  handlePdfUpload,
  handleImageUpload,
  boards,
  addBoard,
  deleteBoard,
  darkMode,
  setDarkMode,
  isRecording,
  startRecording,
  stopRecording,
  lineProps,
  setLineProps,
  arrowProps,
  setArrowProps,
  roundedRectProps,
  setRoundedRectProps,
  ellipseProps,
  setEllipseProps,
  // PDF props
  numPages,
  pageNumber,
  setPageNumber,
  pdfUrl,
  closePdf,
  saveCurrentBoard,
}) => {
  const [showToolOptions, setShowToolOptions] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  // Modern floating toolbar style
  const toolbarContainerClass = cn(
    "fixed top-4 left-1/2 z-30 -translate-x-1/2 flex flex-col md:flex-row items-center gap-4 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-lg transition-all duration-300",
    darkMode
      ? "bg-gray-900/90 border border-gray-800 shadow-gray-900/30"
      : "bg-white/90 border border-gray-200 shadow-gray-200/30"
  );

  const mobileMenuClass = cn(
    "fixed top-[10rem] inset-x-0 mx-auto z-40 w-[90%] max-w-xs rounded-2xl shadow-xl backdrop-blur-lg transition-all duration-300 py-3 px-4",
    darkMode
      ? "bg-gray-900/90 border border-gray-800"
      : "bg-white/90 border border-gray-200"
  );

  const RecordingButton = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleRecording}
      title={isRecording ? "Stop Recording" : "Start Recording"}
      className={cn(
        "hidden md:inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
        isRecording
          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
          : darkMode
          ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
      )}
    >
      {isRecording ? <LuVideoOff size={20} /> : <LuVideo size={20} />}
    </motion.button>
  );

  const colorPickerClass = cn(
    "w-6 h-6 rounded-full appearance-none cursor-pointer",
    "border-2",
    darkMode ? "border-gray-700" : "border-gray-300"
  );

  const inputClass = cn(
    "w-14 text-xs rounded-lg px-2 py-1",
    darkMode
      ? "bg-gray-800 text-gray-200 border-gray-700"
      : "bg-white text-gray-700 border-gray-300"
  );

  const labelClass = cn(
    "text-xs font-medium",
    darkMode ? "text-gray-300" : "text-gray-600"
  );

  // Drawing tools for mobile dropdown
  const drawingTools = [
    { id: "pen", icon: LuBrush, title: "Pen" },
    { id: "highlight", icon: LuHighlighter, title: "Highlight" },
    { id: "text", icon: LuType, title: "Text" },
    { id: "line", icon: LuSlash, title: "Line" },
    { id: "arrow", icon: LuArrowRight, title: "Arrow" },
    { id: "circle", icon: LuCircle, title: "Ellipse" },
    { id: "roundedRect", icon: LuSquare, title: "Rounded Rectangle" },
  ];

  return (
    <>
      {/* Main toolbar - simplified for mobile, full for desktop */}
      <div className={toolbarContainerClass}>
        <div className="flex flex-row items-center gap-2 md:gap-3">
          <ToolbarButton
            onClick={switchToWriteMode}
            title="Write"
            icon={LuPenTool}
            isActive={mode === "write"}
            darkMode={darkMode}
          />
          <ToolbarButton
            onClick={() => setMode("select")}
            title="Select"
            icon={LuMousePointer}
            isActive={mode === "select"}
            darkMode={darkMode}
          />
          {mode === "select" && selectedElements.size > 0 && (
            <ToolbarButton
              onClick={deleteElement}
              title="Delete"
              icon={LuX}
              isActive={false}
              darkMode={darkMode}
              className="text-red-500"
            />
          )}
          {mode === "write" && (
            <>
              <div className="hidden md:flex items-center gap-2">
                {drawingTools.map((toolItem) => (
                  <ToolbarButton
                    key={toolItem.id}
                    onClick={() => setTool(toolItem.id)}
                    title={toolItem.title}
                    icon={toolItem.icon}
                    isActive={tool === toolItem.id}
                    darkMode={darkMode}
                  />
                ))}
              </div>
              <div className="md:hidden">
                <ToolbarButton
                  onClick={() => setShowMobileTools(!showMobileTools)}
                  title="Drawing Tools"
                  icon={
                    tool === "pen"
                      ? LuBrush
                      : tool === "highlight"
                      ? LuHighlighter
                      : tool === "text"
                      ? LuType
                      : tool === "line"
                      ? LuSlash
                      : tool === "arrow"
                      ? LuArrowRight
                      : tool === "circle"
                      ? LuCircle
                      : tool === "roundedRect"
                      ? LuSquare
                      : LuBrush
                  }
                  isActive={showMobileTools}
                  darkMode={darkMode}
                />
              </div>
              <ToolbarButton
                onClick={() => setShowToolOptions(!showToolOptions)}
                title="Tool Options"
                icon={LuChevronDown}
                isActive={showToolOptions}
                darkMode={darkMode}
              />
            </>
          )}
        </div>

        {/* Divider - removed for mobile */}
        <div
          className={cn(
            "h-8 w-px mx-1 hidden md:block",
            darkMode ? "bg-gray-700" : "bg-gray-200"
          )}
        ></div>

        {/* Board controls - simplified for mobile */}
        <div className="flex flex-row items-center gap-2 md:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowBoardMenu(!showBoardMenu)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all",
                darkMode
                  ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
              )}
            >
              <LuLayers size={16} />
              <span className="hidden sm:inline">
                {boards.find((b) => b.id === activeBoardId)?.name || "Board"}
              </span>
              <LuChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  showBoardMenu ? "rotate-180" : ""
                )}
              />
            </button>

            <AnimatePresence>
              {showBoardMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "absolute top-full mt-2 left-0 z-50 w-48 rounded-xl shadow-lg overflow-hidden",
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  )}
                >
                  <div className="py-1 max-h-[40vh] overflow-y-auto">
                    {boards.map((board) => (
                      <button
                        key={board.id}
                        onClick={() => {
                          setActiveBoardId(board.id);
                          setSelectedElements(new Set());
                          setShowBoardMenu(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-2 text-sm",
                          board.id === activeBoardId
                            ? darkMode
                              ? "bg-violet-600 text-white"
                              : "bg-violet-100 text-violet-800"
                            : darkMode
                            ? "text-gray-200 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {board.name}
                        {board.id === activeBoardId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBoard(board.id);
                            }}
                            className={cn(
                              "p-1 rounded-full cursor-pointer",
                              darkMode
                                ? "hover:bg-gray-600"
                                : "hover:bg-gray-200"
                            )}
                          >
                            <LuTrash size={14} className="text-red-500" />
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        addBoard();
                        setShowBoardMenu(false);
                      }}
                      className={cn(
                        "flex items-center w-full px-4 py-2 text-sm",
                        darkMode
                          ? "text-gray-200 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <LuPlus size={16} className="mr-2" />
                      Add Board
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Save button */}
          <ToolbarButton
            onClick={saveCurrentBoard}
            title="Save Board as PNG"
            icon={LuSave}
            isActive={false}
            darkMode={darkMode}
          />

          {/* PDF Navigation (only show if PDF is loaded) */}
          {pdfUrl && numPages && (
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={handlePrevPage}
                title="Previous Page"
                icon={LuChevronLeft}
                isActive={false}
                darkMode={darkMode}
                disabled={pageNumber <= 1}
                className={cn(
                  pageNumber <= 1 && "opacity-50 cursor-not-allowed"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded",
                  darkMode
                    ? "text-gray-300 bg-gray-800"
                    : "text-gray-600 bg-gray-100"
                )}
              >
                {pageNumber} / {numPages}
              </span>
              <ToolbarButton
                onClick={handleNextPage}
                title="Next Page"
                icon={LuChevronRight}
                isActive={false}
                darkMode={darkMode}
                disabled={pageNumber >= numPages}
                className={cn(
                  pageNumber >= numPages && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
          )}

          {/* PDF close button */}
          {pdfUrl && (
            <ToolbarButton
              onClick={closePdf}
              title="Close PDF"
              icon={LuX}
              darkMode={darkMode}
            />
          )}

          {/* Hide PDF upload on mobile, show on larger screens */}
          <label
            title="Upload Image"
            className={cn(
              "hidden md:inline-flex cursor-pointer items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
              darkMode
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
            )}
          >
            <LuImage size={20} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <label
            title="Upload PDF"
            className={cn(
              "hidden md:inline-flex cursor-pointer items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
              darkMode
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
            )}
          >
            <LuUpload size={20} />
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
          </label>

          <ToolbarButton
            onClick={() => setDarkMode((prev) => !prev)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            icon={darkMode ? LuSun : LuMoon}
            isActive={false}
            darkMode={darkMode}
          />

          {RecordingButton}
        </div>
      </div>

      {/* Mobile-specific drawing tools menu */}
      <AnimatePresence>
        {showMobileTools && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={mobileMenuClass}
          >
            <div className="grid grid-cols-4 gap-2">
              {drawingTools.map((toolItem) => (
                <button
                  key={toolItem.id}
                  onClick={() => {
                    setTool(toolItem.id);
                    setShowMobileTools(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                    tool === toolItem.id
                      ? darkMode
                        ? "bg-violet-600 text-white"
                        : "bg-violet-100 text-violet-800"
                      : darkMode
                      ? "text-gray-200 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <toolItem.icon size={20} />
                  <span className="text-xs mt-1">{toolItem.title}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setShowMobileTools(false)}
                className={cn(
                  "flex items-center justify-center px-4 py-2 rounded-lg text-sm",
                  darkMode
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-specific PDF upload option at the bottom of the screen */}
      <div className="fixed bottom-4 right-4 z-30 md:hidden flex flex-col gap-2">
        <label
          title="Upload Image"
          className={cn(
            "flex cursor-pointer items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200",
            darkMode
              ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          )}
        >
          <LuImage size={20} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        <label
          title="Upload PDF"
          className={cn(
            "flex cursor-pointer items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200",
            darkMode
              ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          )}
        >
          <LuUpload size={20} />
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Tool options panel with improved mobile support */}
      <AnimatePresence>
        {mode === "write" && showToolOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "fixed left-1/2 top-[5.5rem] mt-2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-3 z-40 p-3 rounded-lg shadow-md backdrop-blur-lg max-w-[95%] overflow-x-auto",
              darkMode
                ? "bg-gray-900/95 border border-gray-800"
                : "bg-white/95 border border-gray-200"
            )}
          >
            {tool === "pen" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={penProps.color}
                    onChange={(e) =>
                      setPenProps({ ...penProps, color: e.target.value })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={penProps.width}
                    onChange={(e) =>
                      setPenProps({
                        ...penProps,
                        width: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Similar updates for other tool options, keeping the same pattern */}
            {tool === "highlight" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={highlightProps.color}
                    onChange={(e) =>
                      setHighlightProps({
                        ...highlightProps,
                        color: e.target.value,
                      })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={highlightProps.width}
                    onChange={(e) =>
                      setHighlightProps({
                        ...highlightProps,
                        width: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {tool === "text" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={textProps.color}
                    onChange={(e) =>
                      setTextProps({ ...textProps, color: e.target.value })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Size:</label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={textProps.fontSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setTextProps({ ...textProps, fontSize: newSize });
                      if (textBox) {
                        setTextBox((prev) =>
                          prev
                            ? {
                                ...prev,
                                fontSize: newSize,
                                height: Math.max(40, newSize * 2),
                              }
                            : null
                        );
                      }
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {tool === "line" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={lineProps.color}
                    onChange={(e) =>
                      setLineProps({ ...lineProps, color: e.target.value })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={lineProps.width}
                    onChange={(e) =>
                      setLineProps({
                        ...lineProps,
                        width: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {tool === "arrow" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={arrowProps.color}
                    onChange={(e) =>
                      setArrowProps({ ...arrowProps, color: e.target.value })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={arrowProps.width}
                    onChange={(e) =>
                      setArrowProps({
                        ...arrowProps,
                        width: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {tool === "circle" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={ellipseProps.color}
                    onChange={(e) =>
                      setEllipseProps({
                        ...ellipseProps,
                        color: e.target.value,
                      })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={ellipseProps.strokeWidth}
                    onChange={(e) =>
                      setEllipseProps({
                        ...ellipseProps,
                        strokeWidth: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {tool === "roundedRect" && (
              <div className="flex flex-wrap items-center gap-3 w-full justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Color:</label>
                  <input
                    type="color"
                    value={roundedRectProps.color}
                    onChange={(e) =>
                      setRoundedRectProps({
                        ...roundedRectProps,
                        color: e.target.value,
                      })
                    }
                    className={colorPickerClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={roundedRectProps.strokeWidth}
                    onChange={(e) =>
                      setRoundedRectProps({
                        ...roundedRectProps,
                        strokeWidth: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className={labelClass}>Radius:</label>
                  <input
                    type="number"
                    min="0"
                    value={roundedRectProps.radius}
                    onChange={(e) =>
                      setRoundedRectProps({
                        ...roundedRectProps,
                        radius: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Add a close button for mobile */}
            <button
              className="mt-2 sm:hidden px-3 py-1 rounded-lg text-xs font-medium border"
              onClick={() => setShowToolOptions(false)}
              style={{
                background: darkMode ? "#2D3748" : "#F7FAFC",
                borderColor: darkMode ? "#4A5568" : "#E2E8F0",
                color: darkMode ? "#E2E8F0" : "#4A5568",
              }}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

Toolbar.displayName = "Toolbar";

export default memo(Toolbar);

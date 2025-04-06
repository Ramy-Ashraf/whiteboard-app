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
} from "react-icons/lu";
import { motion } from "framer-motion";

// Memoize button styles
const darkModeStyles = {
  base: "bg-gray-800 text-gray-200 hover:bg-gray-700 hover:translate-y-[-2px] transform-gpu border border-gray-700",
  light: "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:translate-y-[-2px] transform-gpu border border-gray-300",
};

// Memoize ToolbarButton component
const ToolbarButton = memo(({ onClick, title, icon: Icon, isActive, darkMode }) => {
  const buttonStyle = useMemo(() => `flex items-center justify-center w-8 h-8 rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_4px_rgba(255,255,255,0.1)] transition-all ${
    isActive
      ? "bg-purple-600 text-white transform-gpu translate-y-[-1px] border border-purple-700"
      : darkMode
      ? darkModeStyles.base
      : darkModeStyles.light
  }`, [isActive, darkMode]);

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95, y: 1 }}
      onClick={onClick}
      title={title}
      className={buttonStyle}
    >
      <Icon size={16} />
    </motion.button>
  );
});

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
}) => {
  const [showToolOptions, setShowToolOptions] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const RecordingButton = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleRecording}
      title={isRecording ? "Stop Recording" : "Start Recording"}
      className={`hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full shadow transition ${
        isRecording
          ? "bg-red-600 text-white"
          : darkMode
          ? "bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-800"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
      }`}
    >
      {isRecording ? <LuSquare size={16} /> : <LuCircle size={16} />}
    </motion.button>
  );

  return (
    <div
      className={`mb-2 py-2 px-4 ${
        darkMode ? "bg-gray-950 border border-gray-800" : "bg-gray-200 border border-gray-300"
      } rounded-lg shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_8px_rgba(255,255,255,0.1)] transform-gpu`}
    >
      {activeBoard.pdfUrl ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            <h1 className="text-lg font-bold truncate max-w-[150px] md:max-w-xs">
              {activeBoard.pdfUrl.split("/").pop()}
            </h1>
            <ToolbarButton
              onClick={() =>
                setBoards((prevBoards) =>
                  prevBoards.map((board) =>
                    board.id === activeBoardId
                      ? { ...board, pdfUrl: null }
                      : board
                  )
                )
              }
              title="Exit Upload"
              icon={LuX}
              isActive={false}
              darkMode={darkMode}
            />
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <label
              title="Upload PDF"
              className={`hidden md:inline-flex cursor-pointer items-center justify-center w-8 h-8 rounded-full shadow transition ${
                darkMode
                  ? "bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <LuUpload size={16} />
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
            </label>
            <select
              value={activeBoardId}
              onChange={(e) => {
                if (e.target.value === "add") {
                  addBoard();
                } else {
                  setActiveBoardId(Number(e.target.value));
                  setSelectedElements(new Set());
                }
              }}
              className={`px-2 py-1 text-sm rounded-full shadow focus:outline-none ${
                darkMode
                  ? "bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
              <option value="add">+ Add Board</option>
            </select>
            <ToolbarButton
              onClick={() => deleteBoard(activeBoardId)}
              title="Delete Board"
              icon={LuTrash}
              isActive={false}
              darkMode={darkMode}
            />
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
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
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
              />
            )}
            {mode === "write" && (
              <>
                {/* Desktop: show tool buttons in the toolbar */}
                <div className="hidden md:flex items-center gap-1 md:gap-2">
                  <ToolbarButton
                    onClick={() => setTool("pen")}
                    title="Pen"
                    icon={LuBrush}
                    isActive={tool === "pen"}
                    darkMode={darkMode}
                  />
                  <ToolbarButton
                    onClick={() => setTool("highlight")}
                    title="Highlight"
                    icon={LuHighlighter}
                    isActive={tool === "highlight"}
                    darkMode={darkMode}
                  />
                  <ToolbarButton
                    onClick={() => setTool("text")}
                    title="Text"
                    icon={LuType}
                    isActive={tool === "text"}
                    darkMode={darkMode}
                  />
                  {/* New shape tools */}
                  <ToolbarButton
                    onClick={() => setTool("line")}
                    title="Line"
                    icon={LuSlash}
                    isActive={tool === "line"}
                    darkMode={darkMode}
                  />
                  <ToolbarButton
                    onClick={() => setTool("arrow")}
                    title="Arrow"
                    icon={LuArrowRight}
                    isActive={tool === "arrow"}
                    darkMode={darkMode}
                  />
                  <ToolbarButton
                    onClick={() => setTool("circle")}
                    title="Circle"
                    icon={LuCircle}
                    isActive={tool === "circle"}
                    darkMode={darkMode}
                  />
                  <ToolbarButton
                    onClick={() => setTool("roundedRect")}
                    title="Rounded Rectangle"
                    icon={LuSquare}
                    isActive={tool === "roundedRect"}
                    darkMode={darkMode}
                  />
                </div>
                {/* Always show tool options toggle */}
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

          <div className="flex items-center gap-1 md:gap-2">
            <label
              title="Upload PDF"
              className={`hidden md:inline-flex cursor-pointer items-center justify-center w-8 h-8 rounded-full shadow transition ${
                darkMode
                  ? "bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <LuUpload size={16} />
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
            </label>
            <select
              value={activeBoardId}
              onChange={(e) => {
                if (e.target.value === "add") {
                  addBoard();
                } else {
                  setActiveBoardId(Number(e.target.value));
                  setSelectedElements(new Set());
                }
              }}
              className={`px-2 py-1 text-sm rounded-full shadow focus:outline-none ${
                darkMode
                  ? "bg-gray-900 text-gray-200 hover:bg-gray-800 border border-gray-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
              <option value="add">+ Add Board</option>
            </select>
            <ToolbarButton
              onClick={() => deleteBoard(activeBoardId)}
              title="Delete Board"
              icon={LuTrash}
              isActive={false}
              darkMode={darkMode}
            />
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
      )}

      {mode === "write" && showToolOptions && (
        <div
          className={`mt-2 flex flex-wrap items-center gap-4 justify-start ${
            darkMode ? "bg-gray-950 border border-gray-800" : "bg-gray-100 border border-gray-300"
          } p-2 rounded-lg shadow`}
        >
          {/* Mobile: show tool buttons inside tool options */}
          <div className="flex md:hidden items-center gap-1 md:gap-2">
            <ToolbarButton
              onClick={() => setTool("pen")}
              title="Pen"
              icon={LuBrush}
              isActive={tool === "pen"}
              darkMode={darkMode}
            />
            <ToolbarButton
              onClick={() => setTool("highlight")}
              title="Highlight"
              icon={LuHighlighter}
              isActive={tool === "highlight"}
              darkMode={darkMode}
            />
            <ToolbarButton
              onClick={() => setTool("text")}
              title="Text"
              icon={LuType}
              isActive={tool === "text"}
              darkMode={darkMode}
            />
            {/* New shape tools for mobile */}
            <ToolbarButton
              onClick={() => setTool("line")}
              title="Line"
              icon={LuSlash}
              isActive={tool === "line"}
              darkMode={darkMode}
            />
            <ToolbarButton
              onClick={() => setTool("arrow")}
              title="Arrow"
              icon={LuArrowRight}
              isActive={tool === "arrow"}
              darkMode={darkMode}
            />
            <ToolbarButton
              onClick={() => setTool("circle")}
              title="Circle"
              icon={LuCircle}
              isActive={tool === "circle"}
              darkMode={darkMode}
            />
            <ToolbarButton
              onClick={() => setTool("roundedRect")}
              title="Rounded Rectangle"
              icon={LuSquare}
              isActive={tool === "roundedRect"}
              darkMode={darkMode}
            />
          </div>
          {tool === "pen" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Color:
              </label>
              <input
                type="color"
                value={penProps.color}
                onChange={(e) =>
                  setPenProps({ ...penProps, color: e.target.value })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Width:
              </label>
              <input
                type="number"
                min="1"
                value={penProps.width}
                onChange={(e) =>
                  setPenProps({ ...penProps, width: Number(e.target.value) })
                }
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
          {tool === "highlight" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Color:
              </label>
              <input
                type="color"
                value={highlightProps.color}
                onChange={(e) =>
                  setHighlightProps({
                    ...highlightProps,
                    color: e.target.value,
                  })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Width:
              </label>
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
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
          {tool === "text" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                Color:
              </label>
              <input
                type="color"
                value={textProps.color}
                onChange={(e) =>
                  setTextProps({ ...textProps, color: e.target.value })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                Size:
              </label>
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
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
          {tool === "line" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Line Color:
              </label>
              <input
                type="color"
                value={lineProps.color}
                onChange={(e) =>
                  setLineProps({ ...lineProps, color: e.target.value })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Line Size:
              </label>
              <input
                type="number"
                min="1"
                value={lineProps.width}
                onChange={(e) =>
                  setLineProps({ ...lineProps, width: Number(e.target.value) })
                }
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
          {tool === "arrow" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Arrow Color:
              </label>
              <input
                type="color"
                value={arrowProps.color}
                onChange={(e) =>
                  setArrowProps({ ...arrowProps, color: e.target.value })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Arrow Size:
              </label>
              <input
                type="number"
                min="1"
                value={arrowProps.width}
                onChange={(e) =>
                  setArrowProps({ ...arrowProps, width: Number(e.target.value) })
                }
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
          {tool === "circle" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Border Color:
              </label>
              <input
                type="color"
                value={penProps.color}
                onChange={(e) =>
                  setPenProps({ ...penProps, color: e.target.value })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Border Width:
              </label>
              <input
                type="number"
                min="1"
                value={penProps.width}
                onChange={(e) =>
                  setPenProps({ ...penProps, width: Number(e.target.value) })
                }
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
          {tool === "roundedRect" && (
            <div className="flex items-center gap-1 md:gap-2">
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Corner Radius:
              </label>
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
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Color:
              </label>
              <input
                type="color"
                value={roundedRectProps.color}
                onChange={(e) =>
                  setRoundedRectProps({
                    ...roundedRectProps,
                    color: e.target.value,
                  })
                }
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Border Size:
              </label>
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
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Toolbar);

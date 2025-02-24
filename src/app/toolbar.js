﻿"use client";

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
  base: "bg-gray-700 text-gray-200 hover:bg-gray-600",
  light: "bg-white text-gray-700 hover:bg-gray-100",
};

// Memoize ToolbarButton component
const ToolbarButton = memo(({ onClick, title, icon: Icon, isActive, darkMode }) => {
  const buttonStyle = useMemo(() => `flex items-center justify-center w-8 h-8 rounded-full shadow transition ${
    isActive
      ? "bg-blue-600 text-white"
      : darkMode
      ? darkModeStyles.base
      : darkModeStyles.light
  }`, [isActive, darkMode]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  highlightColor,
  setHighlightColor,
  highlightWidth,
  setHighlightWidth,
  textColor,
  setTextColor,
  textFontSize,
  setTextFontSize,
  textBox,
  setTextBox,
  handlePdfUpload,
  boards,
  addBoard,
  deleteBoard,
  darkMode,
  setDarkMode,
  startRecording,
  stopRecording,
  lineColor,
  setLineColor,
  lineWidth,
  setLineWidth,
  arrowColor,
  setArrowColor,
  arrowWidth,
  setArrowWidth,
  // New props for circle controls:
  circleStrokeColor,
  setCircleStrokeColor,
  circleStrokeWidth,
  setCircleStrokeWidth,
  // New props for rounded rectangle controls:
  roundedRectRadius,
  setRoundedRectRadius,
  // New props for rectangle border controls:
  roundedRectColor,
  setRoundedRectColor,
  roundedRectStrokeWidth,
  setRoundedRectStrokeWidth,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showToolOptions, setShowToolOptions] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
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
          ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
          : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {isRecording ? <LuSquare size={16} /> : <LuCircle size={16} />}
    </motion.button>
  );

  return (
    <div
      className={`mb-2 py-2 px-4 ${
        darkMode ? "bg-gray-800" : "bg-gray-50"
      } rounded-lg shadow-md`}
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
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
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
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
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
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
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
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
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
            darkMode ? "bg-gray-700" : "bg-white"
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
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
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
                value={penWidth}
                onChange={(e) => setPenWidth(Number(e.target.value))}
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
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
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
                value={highlightWidth}
                onChange={(e) => setHighlightWidth(Number(e.target.value))}
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
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-6 h-6 border-none bg-transparent rounded-full"
              />
              <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                Size:
              </label>
              <input
                type="number"
                min="10"
                max="50"
                value={textFontSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setTextFontSize(newSize);
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
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
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
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
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
                value={arrowColor}
                onChange={(e) => setArrowColor(e.target.value)}
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
                value={arrowWidth}
                onChange={(e) => setArrowWidth(Number(e.target.value))}
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
                value={circleStrokeColor}
                onChange={(e) => setCircleStrokeColor(e.target.value)}
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
                value={circleStrokeWidth}
                onChange={(e) => setCircleStrokeWidth(Number(e.target.value))}
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
                value={roundedRectRadius}
                onChange={(e) => setRoundedRectRadius(Number(e.target.value))}
                className="w-12 text-xs border rounded-full px-1 py-0.5 text-black"
              />
              <label
                className={`text-xs font-medium ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Rect Color:
              </label>
              <input
                type="color"
                value={roundedRectColor}
                onChange={(e) => setRoundedRectColor(e.target.value)}
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
                value={roundedRectStrokeWidth}
                onChange={(e) =>
                  setRoundedRectStrokeWidth(Number(e.target.value))
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

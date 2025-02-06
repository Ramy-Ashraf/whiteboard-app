import React, { useState } from "react";
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
} from "react-icons/lu";

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
}) => {
  const [isRecording, setIsRecording] = useState(false);

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
    <button
      onClick={toggleRecording}
      title={isRecording ? "Stop Recording" : "Start Recording"}
      className={`hidden md:inline-flex px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
        isRecording ? "bg-red-600 text-white" : "bg-gray-200 text-white"
      }`}
    >
      {isRecording ? (
        <LuSquare size={24} />
      ) : (
        <LuCircle size={24} color="red" />
      )}
    </button>
  );

  return (
    <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      {activeBoard.pdfUrl ? (
        <>
          {/* PDF mode header */}
          <div className="flex flex-row items-center gap-2 w-full">
            <h1 className="text-2xl font-bold">
              {activeBoard.pdfUrl.split("/").pop()}
            </h1>
            <button
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
              className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <LuX size={24} />
            </button>
          </div>
          {/* Level 3 buttons */}
          <div className="flex flex-nowrap items-center gap-2 justify-center md:justify-end">
            <label
              title="Upload PDF"
              className="hidden md:inline-flex cursor-pointer items-center px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <LuUpload size={24} />
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
              className="px-3 py-1 rounded shadow focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
              <option value="add">+ Add Board</option>
            </select>
            <button
              onClick={() => deleteBoard(activeBoardId)}
              title="Delete Board"
              className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-red-600 text-white"
            >
              <LuTrash size={24} />
            </button>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200"
            >
              {darkMode ? (
                <LuSun size={24} color="#FDB813" />
              ) : (
                <LuMoon size={24} />
              )}
            </button>
            {RecordingButton}
          </div>
        </>
      ) : (
        <>
          {/* Level 1: Mode and tool selection */}
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
            <button
              onClick={switchToWriteMode}
              title="Write"
              className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                mode === "write"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <LuPenTool size={24} />
            </button>
            <button
              onClick={() => setMode("select")}
              title="Select"
              className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                mode === "select"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <LuMousePointer size={24} />
            </button>
            {mode === "select" && selectedElements.size > 0 && (
              <button
                onClick={deleteElement}
                title="Delete"
                className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-red-600 text-white"
              >
                <LuX size={24} />
              </button>
            )}
            {mode === "write" && (
              <>
                <button
                  onClick={() => setTool("pen")}
                  title="Pen"
                  className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                    tool === "pen"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <LuBrush size={24} />
                </button>
                <button
                  onClick={() => setTool("highlight")}
                  title="Highlight"
                  className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                    tool === "highlight"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <LuHighlighter size={24} />
                </button>
                <button
                  onClick={() => setTool("text")}
                  title="Text"
                  className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                    tool === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <LuType size={24} />
                </button>
              </>
            )}
          </div>

          {/* Level 2: Tool-specific options */}
          {mode === "write" && (
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {tool === "pen" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="whitespace-nowrap">Pen Color:</label>
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-8 h-8 border-none bg-transparent"
                  />
                  <label className="whitespace-nowrap">Pen Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="w-16 border rounded px-1 py-0.5 text-black"
                  />
                </div>
              )}
              {tool === "highlight" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="whitespace-nowrap">Highlight Color:</label>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-8 h-8 border-none bg-transparent"
                  />
                  <label className="whitespace-nowrap">Highlight Width:</label>
                  <input
                    type="number"
                    min="1"
                    value={highlightWidth}
                    onChange={(e) => setHighlightWidth(Number(e.target.value))}
                    className="w-16 border rounded px-1 py-0.5 text-black"
                  />
                </div>
              )}
              {tool === "text" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="whitespace-nowrap">Text Color:</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 border-none bg-transparent"
                  />
                  <label className="whitespace-nowrap">Font Size:</label>
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
                    className="w-16 border rounded px-1 py-0.5 text-black"
                  />
                </div>
              )}
            </div>
          )}

          {/* Level 3: Right-side controls */}
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end">
            <label
              title="Upload PDF"
              className="hidden md:inline-flex cursor-pointer items-center px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <LuUpload size={24} />
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
              className="px-3 py-1 rounded shadow focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
              <option value="add">+ Add Board</option>
            </select>
            <button
              onClick={() => deleteBoard(activeBoardId)}
              title="Delete Board"
              className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-red-600 text-white"
            >
              <LuTrash size={24} />
            </button>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200"
            >
              {darkMode ? (
                <LuSun size={24} color="#FDB813" />
              ) : (
                <LuMoon size={24} />
              )}
            </button>
            {RecordingButton}
          </div>
        </>
      )}
    </div>
  );
};

export default Toolbar;
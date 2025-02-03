import React from "react";
    const Toolbar = ({
        activeBoard,
        activeBoardId,
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
        setDarkMode
    }) => {
        return (
            <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {activeBoard.pdfUrl ? (
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">
                                Uploaded: {activeBoard.pdfUrl.split("/").pop()}
                            </h1>
                            <button
                                onClick={() =>
                                    setBoards((prevBoards) =>
                                        prevBoards.map((board) =>
                                            board.id === activeBoardId ? { ...board, pdfUrl: null } : board
                                        )
                                    )
                                }
                                className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                Exit Upload
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={switchToWriteMode}
                                className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                                    mode === "write"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                            >
                                ✏️ Write
                            </button>
                            <button
                                onClick={() => setMode("select")}
                                className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                                    mode === "select"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                            >
                                ✥ Select
                            </button>
                            {mode === "select" && selectedElements.size > 0 && (
                                <button
                                    onClick={deleteElement}
                                    className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-red-600 text-white"
                                >
                                    Delete
                                </button>
                            )}
                            {mode === "write" && (
                                <>
                                    <button
                                        onClick={() => setTool("pen")}
                                        className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                                            tool === "pen"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        🖌 Pen
                                    </button>
                                    <button
                                        onClick={() => setTool("highlight")}
                                        className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                                            tool === "highlight"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        🖍 Highlight
                                    </button>
                                    <button
                                        onClick={() => setTool("text")}
                                        className={`px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none ${
                                            tool === "text"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        🔤 Text
                                    </button>

                                    {tool === "pen" && (
                                        <div className="flex items-center gap-2">
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
                                        <div className="flex items-center gap-2">
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
                                                onChange={(e) =>
                                                    setHighlightWidth(Number(e.target.value))
                                                }
                                                className="w-16 border rounded px-1 py-0.5 text-black"
                                            />
                                        </div>
                                    )}
                                    {tool === "text" && (
                                        <div className="flex items-center gap-2">
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
                                                                        height: Math.max(40, newSize * 2)
                                                                    }
                                                                : null
                                                        );
                                                    }
                                                }}
                                                className="w-16 border rounded px-1 py-0.5 text-black"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200 text-gray-700 hover:bg-gray-300">
                        <span className="mr-2">📤</span> Upload PDF
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
                        className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-red-600 text-white"
                    >
                        Delete Board
                    </button>
                    <button
                        onClick={() => setDarkMode((prev) => !prev)}
                        className="px-3 py-1 rounded shadow transition transform hover:scale-105 focus:outline-none bg-gray-200 text-white"
                    >
                        {darkMode ? "☀" : "🌙"}
                    </button>
                </div>
            </div>
        );
    };

    export default Toolbar;
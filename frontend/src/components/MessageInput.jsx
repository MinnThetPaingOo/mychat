import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, FileIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]); // Changed from mediaPreview/mediaType

  const fileInputRef = useRef(null);
  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && attachments.length === 0) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    const messageData = {
      text: text.trim(),
      attachments: attachments.map((att) => ({
        data: att.data,
        type: att.type,
        name: att.name,
        size: att.size,
      })),
    };

    sendMessage(messageData);
    setText("");
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      let type;
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else type = "file";

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          {
            data: reader.result,
            type: type,
            name: file.name,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t border-slate-700/50">
      {attachments.length > 0 && (
        <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
          {attachments.map((att, index) => (
            <div key={index} className="relative">
              {att.type === "image" ? (
                <img
                  src={att.data}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                />
              ) : att.type === "video" ? (
                <video
                  src={att.data}
                  controls
                  className="w-28 h-20 object-cover rounded-lg border border-slate-700"
                />
              ) : (
                <div className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
                  <FileIcon className="w-8 h-8 text-slate-400" />
                  <span className="text-xs text-slate-400 truncate max-w-[70px]">
                    {att.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
                type="button"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="max-w-3xl mx-auto flex space-x-4 text-white"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
          placeholder="Type your message..."
        />

        <input
          type="file"
          accept="image/*,video/*,*/*"
          multiple
          ref={fileInputRef}
          onChange={handleMediaChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${
            attachments.length > 0 ? "text-cyan-500" : ""
          }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!text.trim() && attachments.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;

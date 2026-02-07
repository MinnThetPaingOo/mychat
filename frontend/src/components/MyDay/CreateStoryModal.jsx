import { useState } from "react";
import { X, Image, Type, Palette } from "lucide-react";
import { useMyDayStore } from "../../store/useMyDayStore";
import toast from "react-hot-toast";

const CreateStoryModal = ({ isOpen, onClose }) => {
  const [storyType, setStoryType] = useState("text");
  const [caption, setCaption] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#4F46E5");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const { createStory, isCreating } = useMyDayStore();

  const colors = [
    "#4F46E5",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#000000",
  ];

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (storyType === "text" && !caption.trim()) {
      toast.error("Please add some text to your story");
      return;
    }

    if (storyType === "media" && !mediaFile) {
      toast.error("Please select a media file");
      return;
    }

    const storyData = {
      caption,
      backgroundColor,
    };

    // Convert media to base64 if present
    if (storyType === "media" && mediaFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        storyData.media = {
          data: reader.result,
          type: mediaFile.type.startsWith("image/") ? "image" : "video",
        };

        try {
          await createStory(storyData);
          onClose();
          resetForm();
        } catch (error) {
          // Error handled in store
        }
      };
      reader.readAsDataURL(mediaFile);
    } else {
      // Text-only story
      try {
        await createStory(storyData);
        onClose();
        resetForm();
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const resetForm = () => {
    setCaption("");
    setBackgroundColor("#4F46E5");
    setMediaFile(null);
    setMediaPreview(null);
    setStoryType("text");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Story</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            className={`btn btn-sm flex-1 ${storyType === "text" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStoryType("text")}
          >
            <Type size={16} /> Text
          </button>
          <button
            className={`btn btn-sm flex-1 ${storyType === "media" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStoryType("media")}
          >
            <Image size={16} /> Media
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="w-full max-h-[40vh] rounded-lg mb-4 flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: storyType === "text" ? backgroundColor : "#000",
            }}
          >
            {storyType === "media" && mediaPreview ? (
              mediaFile?.type.startsWith("image/") ? (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  src={mediaPreview}
                  className="max-h-full max-w-full"
                  controls
                />
              )
            ) : (
              <p className="text-white text-center p-4 text-lg">
                {caption || "Your story text..."}
              </p>
            )}
          </div>

          {storyType === "media" && (
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="file-input file-input-bordered w-full mb-4"
            />
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              storyType === "media"
                ? "Add a caption..."
                : "What's on your mind?"
            }
            className="textarea textarea-bordered w-full mb-4"
            rows={2}
            maxLength={200}
          />

          {storyType === "text" && (
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2 text-sm">
                <Palette size={16} /> Background Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBackgroundColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      backgroundColor === color
                        ? "border-white ring-2 ring-primary"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isCreating || (storyType === "media" && !mediaFile)}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Posting...
                </>
              ) : (
                "Post Story"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;

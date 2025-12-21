import Message from "../models/Message.js";

const messageController = {
  sendMessage: async (req, res) => {
    try {
      const senderId = req.user._id;
      const receiverId = req.params.id;
      const { text, image } = req.body;
      let imageUrl;
      if (image) {
        //upload imagebase64 to cloudinary
        const uploadResponse = await claudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
      });
      await newMessage.save();
      return res.status(200).json({ message: newMessage });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
  receiveMessage: async (req, res) => {
    // Implement actual receive logic here
    res.send("Receive Message Route123");
  },
  conversations: async (req, res) => {
    try {
      const myId = req.user._id;
      const otherId = req.params.id;
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      });
      if (!messages) {
        return res.status(404).json({ error: "Message not found" });
      }
      return res.status(200).json({ messages });
    } catch (error) {
      return res.status(400).json({ error: error.messages });
    }
  },
};

export default messageController;

import User from "./userModel.js";

/**
 * User Service
 * Business logic for user management
 */

export const getUserIdProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Searching for profile with ID: ${id}`);
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-H]{24}$/i)) {
       return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const user = await User.findById(id).select("-password -verificationTokenHash");
    
    if (!user) {
      console.log(`User not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: `Subject ${id} not found in database` });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`Error in getUserIdProfile: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateName = async (req, res) => {
  try {
    const { fullname } = req.body;
    const userId = req.user.id; // From middleware

    const user = await User.findByIdAndUpdate(userId, { fullname }, { new: true });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleEmailVisibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    user.emailVisibility = !user.emailVisibility;
    await user.save();
    res.status(200).json({ success: true, data: { emailVisibility: user.emailVisibility } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const UserService = {
  getUserIdProfile,
  updateName,
  toggleEmailVisibility,
};

export default UserService;

const UserModel = require("../models/userModel");

exports.getProfile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        res.json({ success: true, data: user });
    } catch (err) {
        res.json({ success: false, message: "DB Error" });
    }
};

exports.updateProfile = async (req, res) => {
    const { date_of_birth, gender, address } = req.body;
    const dob = date_of_birth === "" ? null : date_of_birth;

    try {
        await UserModel.updateProfile(req.userId, dob, gender, address);
        res.json({ success: true, message: "Updated" });
    } catch (err) {
        res.json({ success: false, message: "Error Updating Profile" });
    }
};
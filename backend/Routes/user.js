const User = require('../models/UserSchema');
const Booking = require('../models/BookingSchema');
const Doctor = require('../models/DoctorSchema');
const express = require('express');
const {restrict} = require('../utils/helpers');
const passport = require('passport');

const updateUser = async (req, res) => {
    const id = req.params.id;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { $set: req.body }, { new: true });

        if (!updatedUser) {
            // User not found
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Successfully updated
        return res.status(200).json({ success: true, message: 'Successfully updated', data: updatedUser });
    } catch (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};


const deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        const deletedUser = await User.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Successfully deleted', data: deletedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed' });
    }
};

const getSingleUser = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User.findById(id).select('-password');
        // console.log('User:', user);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Successfully found', data: user });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: 'Failed' });
    }
};


const getAllUser = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({ success: true, message: 'Successfully found', data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed' });
    }
};

const getUserProfile = async(req, res)=>{
    // console.log(req);
    const userId=req.user._id;

    try{
        const user=await User.findById(userId);

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const {password, ...rest} = user._doc;

        res.status(200).json({success: true, message: "Profile info is getting", data: {...rest}});
    }
    catch(err){
        res.status(500).json({ success: false, message: 'Something went wrong, cannot get' });
    }
};


const getMyAppointments = async (req, res) => {
    try {
        // Step 1: Retrieve appointments from bookings for the specific user
        const bookings = await Booking.find({ user: req.user._id });

        // Step 2: Extract doctor IDs from the appointment bookings
        const doctorIds = bookings.map((booking) => booking.doctor);

        // Step 3: Retrieve doctors using doctor IDs
        const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select("-password");
        // console.log(doctors);
        res.status(200).json({ success: true, message: "Appointments retrieved", data: doctors });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Something went wrong, cannot get appointments' });
    }
};



const router = express.Router();

router.get('/:id', passport.authenticate("jwt", { session: false}), restrict(["patient"]), getSingleUser);
router.get('/', passport.authenticate("jwt", { session: false}), restrict(["admin"]), getAllUser);
router.put('/:id', passport.authenticate("jwt", { session: false }), restrict(["patient"]), updateUser); // Use router.put for updating
router.delete('/:id',passport.authenticate("jwt", { session: false }), restrict(["patient"]),  deleteUser); // Use router.delete for deleting
router.get('/profile/me',passport.authenticate("jwt", { session: false }), restrict(["patient"]),  getUserProfile); 
router.get('/appointments/my-appointments',passport.authenticate("jwt", { session: false }), restrict(["patient"]),  getMyAppointments); 

module.exports= router;
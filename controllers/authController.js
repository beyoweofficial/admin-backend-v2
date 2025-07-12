const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(401).json({ message: 'Invalid email or password' });
    if (!admin.isActive) return res.status(403).json({ message: 'Admin is disabled' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: admin._id, branch: admin.branch }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      branch: admin.branch,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

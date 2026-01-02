require('dotenv').config({ path: './.env' });

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 8090;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));

// Models
const Video = require("./models/Video");
const Blog = require("./models/Blog");
const Contact = require("./models/contact"); // ← Make sure this exists!

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer for Videos (direct to Cloudinary)
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "portfolio-videos",
        resource_type: "video"
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

// Multer for Blog Images (direct to Cloudinary)
const blogStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "blog-images",
        allowed_formats: ["jpg", "jpeg", "png", "gif"],
        transformation: [{ width: 1200, crop: "limit" }]
    }
});
const uploadBlogImage = multer({ storage: blogStorage });

// App Configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine('ejs', ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Admin Middleware
const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect("/adminlogin");
};

// ==================== PUBLIC ROUTES ====================
app.get("/", (req, res) => res.render("home"));
app.get("/about", (req, res) => res.render("about"));
app.get("/services", (req, res) => res.render("services"));

app.get("/service1", (req, res) => {
    res.render("service1");
})
app.get("/service2", (req, res) => {
    res.render("service2");
})
app.get("/service3", (req, res) => {
    res.render("service3");
})
app.get("/service4", (req, res) => {
    res.render("service4");
})
app.get("/service5", (req, res) => {
    res.render("service5");
})


app.get("/landingpage", (req, res)=>{
    res.render("landingpage");
})

app.get("/contact", (req, res) => res.render("contact"));

app.get("/ourwork", async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
       
        res.render("ourwork", { videos });
    } catch (err) {
        console.error("Error fetching videos:", err);
        res.render("ourwork", { videos: [] });
    }
});



app.get("/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.render("blogs", { blogs });
    } catch (err) {
        console.error("Error fetching blogs:", err);
        res.render("blogs", { blogs: [] });
    }
});


app.get("/blog/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        console.log(blog);
        if (!blog) return res.status(404).render("404", { message: "Blog not found" });
        res.render("blog-details", { blog });
    } catch (err) {
        console.error("Blog details error:", err);
        res.status(500).render("404", { message: "Server error" });
    }
});

// ==================== CONTACT FORM ROUTE ====================
app.post("/contact", async (req, res) => {
  try {
    // Destructure all fields from req.body
    let {
      name,
      email,
      phone,
      subject,
      website,
      message,
      budget,       // new correct name (in case you fixed the form)
      membership
    } = req.body;

    // Clean and trim inputs
    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();
    subject = subject?.trim();
    website = website?.trim() || null;
    message = message?.trim();
    membership = membership?.trim() || null;

    // Fix budget: accept both spellings (supports old and new form submissions)
    const finalBudget = (budget)?.trim() || null;

    // Basic required field validation
    if (!name || !email || !phone || !subject || !message) {
      console.log("Missing required fields");
      return res.redirect("/#contact");
    }

    // Email & Phone validation (Indian mobile format: starts with 6-9, 10 digits)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!emailRegex.test(email)) {
      console.log("Invalid email:", email);
      return res.redirect("/#contact");
    }

    if (!phoneRegex.test(phone)) {
      console.log("Invalid phone:", phone);
      return res.redirect("/#contact");
    }

    // Save to MongoDB with ALL fields including budget & membership
    await Contact.create({
      name,
      email,
      phone,
      subject,
      website,
      message,
      budget: finalBudget,       // Now saved correctly!
      membership                 // Now saved correctly!
    });

    console.log("New contact saved successfully:", { name, email, budget: finalBudget, membership });

    // Success Thank You Page
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - Message Received</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .box {
      width: 90%;
      max-width: 440px;
      background: #ffffff;
      padding: 40px 30px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    }
    h1 {
      font-size: 32px;
      color: #16a34a;
      margin-bottom: 16px;
    }
    p {
      font-size: 17px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    a {
      display: inline-block;
      padding: 14px 32px;
      background: #000000;
      color: #fff;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    a:hover {
      background: #1f2937;
      transform: translateY(-2px);
    }
    .icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    @media (max-width: 480px) {
      h1 { font-size: 26px; }
      .box { padding: 30px 20px; }
      a { width: 100%; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✅</div>
    <h1>Thank You!</h1>
    <p>Your message has been received successfully.<br>We will get back to you very soon.</p>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>
    `);

  } catch (err) {
    console.error("CONTACT FORM ERROR:", err);
    return res.redirect("/#contact"); // safer than root if form is in section
  }
});

// ==================== ADMIN ROUTES ====================
app.get("/adminlogin", (req, res) => {
    if (req.session.isAdmin) return res.redirect("/admin/dashboard");
    res.render("admin/adminlogin", { error: null });
});

app.post("/adminlogin", (req, res) => {
    const { username, password } = req.body;
    if (username === "a" && password === "a") {
        req.session.isAdmin = true;
        return res.redirect("/admin/dashboard");
    }
    res.render("admin/adminlogin", { error: "Invalid username or password" });
});

app.get("/admin/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/adminlogin");
});
// Admin Dashboard (updated to include contacts)
// In your app.js or wherever the dashboard route is defined
app.get("/admin/dashboard", requireAdmin, async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        const blogs = await Blog.find().sort({ createdAt: -1 });
        const contacts = await Contact.find().sort({ createdAt: -1 }); // ← This line is critical!
const demoRequests = await DemoRequest.find().sort({ createdAt: -1 }); // NEW
        res.render("admin/dashboard", { 
            videos, 
            blogs, 
            contacts,               // ← Make sure this is included
            reelsCount: videos.filter(v => v.type === 'reel').length,
            blogsCount: blogs.lengthm,
            demoRequests, // Pass to EJS
        });
    } catch (err) {
        console.error("Dashboard load error:", err);
        // Fallback: pass empty arrays so template doesn't crash
        res.render("admin/dashboard", { 
            videos: [], 
            blogs: [], 
            contacts: [],
            demoRequests: [] 
        });
    }
});

app.get("/admin/contacts/delete/:id", requireAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
    } catch (err) {
        console.error(err);
    }
    res.redirect("/admin/dashboard");
});
// Video Management
app.get("/admin/videos/add/:type", requireAdmin, (req, res) => {
    const type = req.params.type;
    if (!['video', 'reel'].includes(type)) return res.redirect("/admin/dashboard");
    res.render("admin/videos/add", { type, error: null });
});

app.post(
  "/admin/videos/add/:type",
  requireAdmin,
  videoUpload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) throw new Error("No video file selected.");

      const { title, description } = req.body;
      const type = req.params.type;

      const newItem = new Video({
        title: title?.trim() || "Untitled",
        description: description?.trim() || "",
        videoUrl: req.file.path,       // ✅ Cloudinary URL
        publicId: req.file.filename,   // ✅ Cloudinary public_id
        type
      });

      await newItem.save();

      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("Video upload error:", err);
      res.render("admin/videos/add", {
        error: err.message,
        type: req.params.type
      });
    }
  }
);

app.get("/admin/videos/delete/:id", requireAdmin, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (video) {
            await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });
            await Video.findByIdAndDelete(req.params.id);
        }
    } catch (err) {
        console.error("Video delete error:", err);
    }
    res.redirect("/admin/dashboard");
});

// Blog Management
app.get("/admin/blogs/add", requireAdmin, (req, res) => {
    res.render("admin/blogs/add", { error: null });
});

app.post("/admin/blogs/add", requireAdmin, uploadBlogImage.single("image"), async (req, res) => {
    try {
        const { title, paragraph1, paragraph2, quote } = req.body;

        if (!title || !paragraph1 || !paragraph2) {
            throw new Error("Title, Paragraph 1, and Paragraph 2 are required.");
        }

        const newBlog = new Blog({
            title: title.trim(),
            paragraph1: paragraph1.trim(),
            paragraph2: paragraph2.trim(),
            quote: quote?.trim() || "",
            imageUrl: req.file ? req.file.path : null // Cloudinary secure_url
        });

        await newBlog.save();
        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Blog add error:", err);
        res.render("admin/blogs/add", { error: err.message });
    }
});

// Edit & Delete Blog (unchanged but cleaned up)
app.get("/admin/blogs/edit/:id", requireAdmin, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.redirect("/admin/dashboard");
        res.render("admin/blogs/edit", { blog, error: null });
    } catch (err) {
        res.redirect("/admin/dashboard");
    }
});

app.post("/admin/blogs/edit/:id", requireAdmin, uploadBlogImage.single("image"), async (req, res) => {
    try {
        const { title, paragraph1, paragraph2, quote } = req.body;

        if (!title || !paragraph1 || !paragraph2) {
            throw new Error("Required fields missing.");
        }

        const updateData = {
            title: title.trim(),
            paragraph1: paragraph1.trim(),
            paragraph2: paragraph2.trim(),
            quote: quote?.trim() || ""
        };

        if (req.file) {
            updateData.imageUrl = req.file.path; // Cloudinary secure_url
        }

        await Blog.findByIdAndUpdate(req.params.id, updateData);
        res.redirect("/admin/dashboard");
    } catch (err) {
        const blog = await Blog.findById(req.params.id);
        res.render("admin/blogs/edit", { blog, error: err.message });
    }
});

app.get("/admin/blogs/delete/:id", requireAdmin, async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
    } catch (err) {
        console.error("Blog delete error:", err);
    }
    res.redirect("/admin/dashboard");
});

// ==================== CONTACT MANAGEMENT (ADMIN) ====================
app.get("/admin/contacts", requireAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.render("admin/contacts", { contacts }); // Create this view or use dashboard
    } catch (err) {
        console.error("Contacts fetch error:", err);
        res.status(500).send("Error loading contacts");
    }
});

app.get("/admin/contacts/delete/:id", requireAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.redirect("/admin/contacts"); // Or back to dashboard
    } catch (err) {
        console.error("Contact delete error:", err);
        res.redirect("/admin/contacts");
    }
});
const DemoRequest = require('./models/DemoRequest');
// Handle "Book Free Demo" form submission
app.post('/book-demo', async (req, res) => {
  try {
    const { mobile } = req.body;

    // Basic validation (redundant but good practice)
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    const existing = await DemoRequest.findOne({ mobile });
    if (existing) {
      return res.json({ message: 'This number is already registered!' });
    }

    const newRequest = new DemoRequest({ mobile });
    await newRequest.save();

    res.json({ success: true, message: 'Thank you! We will contact you soon.' });
  } catch (err) {
    console.error('Demo request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get("/admin/contacts/delete/:id", requireAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
    } catch (err) {
        console.error(err);
    }
    res.redirect("/admin/dashboard");
});


// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
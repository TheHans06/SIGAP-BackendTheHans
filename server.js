require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// SUPABASE CLOUD CONNECTION
// ==========================================
const supabaseUrl = 'https://zauipsksbxhljyafkmvd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// AUTHENTICATION ROUTE
// ==========================================
app.post('/api/login', async (req, res) => {
    const { nip, pin } = req.body;
    try {
        const { data: user, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('nip', nip)
            .eq('pin', pin)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'NIP atau PIN salah!' });
        }
        // Notice we are now sending back the user's database ID too!
        res.status(200).json({ 
            success: true, 
            message: 'Login successful', 
            user: { id: user.id, name: user.name, nip: user.nip, role: user.role } 
        });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server backend.' });
    }
});

// ==========================================
// STUDENTS ROUTES
// ==========================================

// 1. Get all active students for a specific teacher
app.get('/api/students', async (req, res) => {
    const { teacher_id } = req.query;
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('teacher_id', teacher_id)
            .eq('is_active', true);

        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Add a new student
app.post('/api/students', async (req, res) => {
    const { teacher_id, name } = req.body;
    try {
        const { data, error } = await supabase
            .from('students')
            .insert([{ teacher_id, name }])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// ATTENDANCE ROUTES
// ==========================================

// 3. Save or Update Attendance (Bulk)
app.post('/api/attendance', async (req, res) => {
    const { attendance_records } = req.body; 
    // attendance_records should be an array of objects: 
    // [{ teacher_id, student_id, date, status, note }, ...]

    try {
        // 'upsert' means UPDATE if it exists, INSERT if it doesn't!
        // It uses that UNIQUE(student_id, date) rule you made in SQL.
        const { data, error } = await supabase
            .from('attendance')
            .upsert(attendance_records, { onConflict: 'student_id, date' })
            .select();

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Absensi berhasil disimpan!', data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Cloud-connected backend engine running on http://localhost:${PORT}`);
});
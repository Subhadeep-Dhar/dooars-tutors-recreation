import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { env } from '../config/env';
import { User, Profile, Review } from '../models';

// ── Raw MySQL data (extracted from SQL dump) ──────────────────────────────────

const tutors = [
//   { id: 4,  name: 'Bikash Saha',          phone: '9832174660', email: 'bikashsaha123@gmail.com',    exp: 10,  role: 'Individual', town: 'Jalpaiguri', lat: 26.5486, lng: 88.7194, address: 'Jalpaiguri', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 24, name: 'Rajib Sarkar',          phone: '8001585698', email: 'rajibsarkar024@gmail.com',   exp: 10,  role: 'Individual', town: 'Alipurduar', lat: 26.4911, lng: 89.5274, address: 'Alipurduar', rating: 4.5, ratingCount: 3,  type: 'tutor',            bio: 'Physics teacher', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
  { id: 25, name: 'Biplab Singha',         phone: '8101697535', email: 'biplabsingha825@gmail.com',  exp: 5,   role: 'Individual', town: 'Alipurduar', lat: 26.4886, lng: 89.5340, address: 'Shanti Nagar, Alipurduar', rating: 4.7, ratingCount: 30, type: 'tutor', bio: 'Mathematics teacher with 5 years experience', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 26, name: 'Subhajit Bhattacharyya',phone: '9002507240', email: 'sbjt.bhatt@gmail.com',       exp: 8,   role: 'Individual', town: 'Alipurduar', lat: 26.4796, lng: 89.5176, address: 'Alipurduar', rating: 4.5, ratingCount: 20, type: 'tutor', bio: 'Experienced mathematics tutor', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 27, name: 'Sunny Roy',             phone: '7001467688', email: 'sunnyroy730@gmail.com',      exp: 12,  role: 'Individual', town: 'Alipurduar', lat: 26.4922, lng: 89.5320, address: 'Alipurduar', rating: 4.2, ratingCount: 15, type: 'tutor', bio: 'Mathematics and Physics tutor for classes 4-12', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 28, name: 'Subhadeep Saha',        phone: '7797983888', email: 'subhadeepsaha14@gmail.com',  exp: 6,   role: 'Individual', town: 'Alipurduar', lat: 26.4865, lng: 89.5298, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'English teacher', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 29, name: 'Aniket Datta',          phone: '7001975490', email: 'aniketdatta00@gmail.com',    exp: 3,   role: 'Individual', town: 'Alipurduar', lat: 26.4911, lng: 89.5274, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'Computer Science teacher', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 30, name: 'Sangram Roy',           phone: '8116866034', email: 'sangramroy1987@gmail.com',   exp: 15,  role: 'Individual', town: 'Alipurduar', lat: 26.4922, lng: 89.5320, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'Mathematics and Biology teacher', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 33, name: 'Samim Akhtar',          phone: '8101396484', email: 'samim@gmail.com',            exp: 4,   role: 'Individual', town: 'Alipurduar', lat: 26.4886, lng: 89.5340, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 36, name: 'Prosenjit Roy',         phone: '9647019093', email: 'prosenjit9647@gmail.com',    exp: 5,   role: 'Individual', town: 'Alipurduar', lat: 26.4886, lng: 89.5340, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 37, name: 'Ranajit Kundu',         phone: '8145004001', email: 'ranajitkundu@gmail.com',     exp: 7,   role: 'Individual', town: 'Alipurduar', lat: 26.4796, lng: 89.5176, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 38, name: 'Kaushik Datta',         phone: '9547527273', email: 'kaushikdatta@gmail.com',     exp: 8,   role: 'Individual', town: 'Alipurduar', lat: 26.4865, lng: 89.5298, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'Physics teacher for Class 9-12', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 40, name: 'Apurba Barman',         phone: '7679519337', email: 'apurba@gmail.com',           exp: 6,   role: 'Individual', town: 'Alipurduar', lat: 26.4911, lng: 89.5274, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'Chemistry teacher', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 41, name: 'Ranjit Das',            phone: '9547218999', email: 'ranjitdas@gmail.com',        exp: 5,   role: 'Individual', town: 'Alipurduar', lat: 26.4796, lng: 89.5176, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 42, name: 'Riya Saha',             phone: '9832123456', email: 'riyasaha@gmail.com',         exp: 3,   role: 'Individual', town: 'Alipurduar', lat: 26.4865, lng: 89.5298, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 43, name: 'Moumita Das',           phone: '9734987654', email: 'moumitadas@gmail.com',       exp: 4,   role: 'Individual', town: 'Alipurduar', lat: 26.4886, lng: 89.5340, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'English teacher for primary', profileType: 'tutor', boards: 'WB' },
  { id: 44, name: 'Rajesh Sharma',         phone: '9832765432', email: 'rajesh@gmail.com',           exp: 10,  role: 'Individual', town: 'Alipurduar', lat: 26.4911, lng: 89.5274, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'Maths, Physical Science, Life Science', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 52, name: 'Priya Barman',          phone: '8013456789', email: 'priyabarman@gmail.com',      exp: 5,   role: 'Individual', town: 'Alipurduar', lat: 26.4796, lng: 89.5176, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'English teacher Class 5-12', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 53, name: 'Biplob Roy',            phone: '9647234567', email: 'biplobroy@gmail.com',        exp: 6,   role: 'Individual', town: 'Alipurduar', lat: 26.4865, lng: 89.5298, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 54, name: 'Arnab Chakraborty',     phone: '9832345678', email: 'arnabchakraborty@gmail.com', exp: 7,   role: 'Individual', town: 'Alipurduar', lat: 26.4922, lng: 89.5320, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'Maths, Physical and Life Science', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 55, name: 'Sujata Das',            phone: '7001123456', email: 'sujatadas@gmail.com',        exp: 4,   role: 'Individual', town: 'Alipurduar', lat: 26.4886, lng: 89.5340, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 56, name: 'Bandana Barman',        phone: '8101234567', email: 'bandanabarman@gmail.com',    exp: 8,   role: 'Individual', town: 'Alipurduar', lat: 26.5486, lng: 88.7194, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'arts_trainer',     bio: 'Singing teacher and Geography tutor', profileType: 'arts_trainer', boards: 'WB' },
  { id: 57, name: 'Partha Sarathi Roy',    phone: '9547345678', email: 'partharoy@gmail.com',        exp: 6,   role: 'Individual', town: 'Alipurduar', lat: 26.4796, lng: 89.5176, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 58, name: 'Mrityunjay Barman',     phone: '9832456789', email: 'mrityunjay@gmail.com',       exp: 9,   role: 'Individual', town: 'Alipurduar', lat: 26.4865, lng: 89.5298, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB,CBSE' },
  { id: 63, name: 'Sabita Rani Das',       phone: '8116234567', email: 'sabitadas@gmail.com',        exp: 10,  role: 'Individual', town: 'Alipurduar', lat: 26.4911, lng: 89.5274, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'All subjects Class 1-6', profileType: 'tutor', boards: 'WB' },
  { id: 65, name: 'Debraj Sarkar',         phone: '7001678901', email: 'debrajsarkar@gmail.com',     exp: 5,   role: 'Individual', town: 'Alipurduar', lat: 26.4922, lng: 89.5320, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 68, name: 'Swapan Kumar Das',      phone: '9734567890', email: 'swapankumardas@gmail.com',   exp: 15,  role: 'Organisation', town: 'Alipurduar', lat: 26.4796, lng: 89.5176, address: 'Alipurduar', rating: 0,  ratingCount: 0,  type: 'coaching_center',  bio: 'Established coaching center in Alipurduar', profileType: 'coaching_center', boards: 'WB,CBSE' },
  { id: 69, name: 'Rumpa Barman',          phone: '8013789012', email: 'rumpabarman@gmail.com',      exp: 6,   role: 'Individual', town: 'Alipurduar', lat: 26.4865, lng: 89.5298, address: 'Alipurduar', rating: 0,   ratingCount: 0,  type: 'tutor',            bio: 'English, Hindi, Bengali, History, Geography for Class 1-9', profileType: 'tutor', boards: 'WB' },
  { id: 71, name: 'UDAAN EDUCO INSTITUTE', phone: '9734048803', email: 'udaancob@gmail.com',         exp: 0,   role: 'Organisation', town: 'Coochbehar', lat: 26.3286, lng: 89.4454, address: 'Hotel Green View, Shivendra Narayan Rd, Badur Bagan, Cooch Behar', rating: 0, ratingCount: 0, type: 'coaching_center', bio: 'Educational Coaching Centre for SSC, Banking, Railways, TET/CTET, WBCS, Police/Defence Exams, Spoken English', profileType: 'coaching_center', boards: 'WB' },
  { id: 72, name: 'Bibeck Chakrabarty',    phone: '8637076818', email: 'bibeckchakrabarty@gmail.com',exp: 5,   role: 'Individual', town: 'Alipurduar', lat: 26.5161, lng: 89.4932, address: 'Alipurduar', rating: 5,   ratingCount: 5,  type: 'gym_yoga',         bio: 'MA in Yoga (MAHGU), Diploma in Yoga and Naturopathy (WBCYN)', profileType: 'gym_yoga', boards: '' },
  { id: 73, name: 'Subrata Roy',           phone: '9134719097', email: 'subrataroyapd1234@gmail.com',exp: 18,  role: 'Individual', town: 'Alipurduar', lat: 26.5081, lng: 89.5189, address: 'Ghagra, Alipurduar', rating: 5, ratingCount: 18, type: 'gym_yoga',         bio: 'Yoga trainer with 18 years experience', profileType: 'gym_yoga', boards: '' },
  { id: 75, name: 'Alipurduar Town Club Football Academy', phone: '7699911070', email: 'football1@gmail.com', exp: 0, role: 'Organisation', town: 'Alipurduar', lat: 26.4761, lng: 89.5231, address: 'Maya Talkies Road, Babupara, Sobhaganj, Alipurduar', rating: 0, ratingCount: 0, type: 'sports_trainer', bio: 'Football coaching for males', profileType: 'sports_trainer', boards: '' },
  { id: 76, name: 'Roller Skating Association of Cooch Behar', phone: '8509881409', email: 'labaniajay@gmail.com', exp: 0, role: 'Organisation', town: 'Coochbehar', lat: 26.3255, lng: 89.4402, address: 'Cooch Behar', rating: 0, ratingCount: 0, type: 'sports_trainer', bio: 'Skating coaching for all genders', profileType: 'sports_trainer', boards: '' },
  { id: 77, name: 'Dilip Roy',             phone: '8145723151', email: 'twotechnicalminds@gmail.com', exp: 32, role: 'Individual', town: 'Alipurduar', lat: 26.5102, lng: 89.5568, address: 'Bholar Dabri, Alipurduar', rating: 0, ratingCount: 0, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 78, name: 'Pintu Biswas',          phone: '9641835043', email: 'mpbeditz@gmail.com',         exp: 15,  role: 'Individual', town: 'Alipurduar', lat: 26.4845, lng: 89.5343, address: '953, Shanti Nagar, Alipurduar', rating: 5, ratingCount: 1, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 79, name: 'Tanima Sengupta',       phone: '8436969657', email: 'tanimasengupta43@gmail.com', exp: 7,   role: 'Individual', town: 'Alipurduar', lat: 26.5102, lng: 89.5568, address: 'Bholar Dabri, Alipurduar', rating: 5, ratingCount: 1, type: 'tutor', bio: 'B.Sc. Teaches Physics, Chemistry, Maths, Biology for Class 5-10', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
  { id: 80, name: 'Souvik Bose',           phone: '9641532974', email: 'none2@gmail.com',            exp: 20,  role: 'Individual', town: 'Alipurduar', lat: 26.4922, lng: 89.5320, address: 'Alipurduar', rating: 0, ratingCount: 0, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
  { id: 81, name: 'Tanmay Nag',            phone: '8159879638', email: 'tanmay1512@gmail.com',       exp: 11,  role: 'Individual', town: 'Alipurduar', lat: 26.4881, lng: 89.5269, address: 'Shanti Nagar, Alipurduar', rating: 3, ratingCount: 2, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
  { id: 82, name: 'Manoj Saha',            phone: '9832408207', email: 'manojsaha36@gmail.com',      exp: 14,  role: 'Individual', town: 'Alipurduar', lat: 26.4864, lng: 89.5301, address: 'Shanti Nagar, Alipurduar', rating: 0, ratingCount: 0, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 83, name: 'Liza Chanda',           phone: '8348411980', email: 'lizachanda02@gmail.com',     exp: 2,   role: 'Individual', town: 'Alipurduar', lat: 26.5033, lng: 89.5256, address: 'Arabinda Nagar, Alipurduar', rating: 0, ratingCount: 0, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
  { id: 84, name: 'Swarnadeep Das',        phone: '9883356886', email: 'swarnadeepdas774@gmail.com', exp: 1,   role: 'Individual', town: 'Alipurduar', lat: 26.4908, lng: 89.5340, address: 'Shanti Nagar, Alipurduar', rating: 0, ratingCount: 0, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 85, name: 'Bijay Dey',             phone: '9647755425', email: 'bijoydeyapd03@gmail.com',    exp: 7,   role: 'Individual', town: 'Alipurduar', lat: 26.4969, lng: 89.5303, address: 'Park Road, Alipurduar', rating: 0, ratingCount: 0, type: 'arts_trainer', bio: 'Western dance teacher', profileType: 'arts_trainer', boards: '' },
  { id: 93, name: 'Debarshi Nandi',        phone: '9564261483', email: 'debarshinandi003@gmail.com', exp: 12,  role: 'Individual', town: 'Alipurduar', lat: 26.4755, lng: 89.5224, address: 'Alipurduar', rating: 4.9, ratingCount: 29, type: 'tutor', bio: 'M.Sc. Mathematics, B.Sc. Honours Mathematics, B.Ed. (Ongoing). Science Group Classes VI-VIII, Maths XI-XII', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
  { id: 94, name: 'Nantu Ghosh',           phone: '9749895975', email: 'nantughosh7@gmail.com',      exp: 15,  role: 'Individual', town: 'Alipurduar', lat: 26.4770, lng: 89.5183, address: 'Alipurduar', rating: 5, ratingCount: 2, type: 'tutor', bio: '', profileType: 'tutor', boards: 'WB' },
  { id: 96, name: 'SHREYASI SAHA',         phone: '9051394704', email: 'sshreyasi2212@gmail.com',    exp: 13,  role: 'Individual', town: 'Alipurduar', lat: 26.4967, lng: 89.5273, address: 'Netaji Park, Alipurduar', rating: 0, ratingCount: 0, type: 'tutor', bio: 'MBA(Finance). Expert in Accountancy, Economics, Commerce.', profileType: 'tutor', boards: 'WB,CBSE,CISCE' },
];

// tutor_subjects: tutor_id -> { subject -> [classes] }
const subjectData: Record<number, Record<string, string[]>> = {
  4:  { 'Mathematics': ['6','7','8','9','10','11','12'] },
  24: { 'Physics': ['9','10','11','12'] },
  25: { 'Mathematics': ['9','10','11','12'] },
  26: { 'Mathematics': ['9','10','11','12'] },
  27: { 'Mathematics': ['4','5','6','7','8','9','10','11','12'], 'Physics': ['10','11','12'] },
  28: { 'English': ['7','8','9','10','11','12'] },
  29: { 'Computer Science': ['9','10','11','12'] },
  30: { 'Mathematics': ['7','8','9','10','11','12'], 'Biology': ['11','12'], 'Life Science': ['8','9','10'] },
  36: { 'Mathematics': ['7','8','9','10'] },
  37: { 'Mathematics': ['9','10','11','12'] },
  38: { 'Physics': ['9','10','11','12'] },
  40: { 'Chemistry': ['9','10','11','12'] },
  43: { 'English': ['1','2','3','4'] },
  44: { 'Mathematics': ['7','8','9','10'], 'Physical Science': ['7','8','9','10'], 'Life Science': ['7','8','9','10'] },
  52: { 'English': ['5','6','7','8','9','10','11','12'] },
  54: { 'Mathematics': ['7','8','9','10'], 'Physical Science': ['7','8','9','10'], 'Life Science': ['7','8','9','10'] },
  56: { 'Geography': ['9','10'], 'Bengali': ['9','10'], 'Singing': ['1','2','3','4','5','6','7','8','9','10','11','12'] },
  63: { 'All subjects': ['1','2','3','4','5','6'] },
  69: { 'English': ['1','2','3','4','5','6','7','8','9'], 'Hindi': ['1','2','3','4','5','6','7','8','9'], 'Bengali': ['1','2','3','4','5','6','7','8','9'], 'History': ['1','2','3','4','5','6','7','8','9'], 'Geography': ['1','2','3','4','5','6','7','8','9'] },
  77: { 'English': ['8','9','10','11','12'] },
  78: { 'Bengali': ['7','8','9','10','11','12'], 'History': ['7','8','9','10'], 'Geography': ['7','8','9','10'] },
  79: { 'Mathematics': ['5','6','7','8','9','10'], 'Physics': ['5','6','7','8','9','10'], 'Chemistry': ['5','6','7','8','9','10'], 'Biology': ['5','6','7','8','9','10'] },
  80: { 'Civics': ['11','12'], 'History': ['5','6','7','8','9','10','11','12'], 'Geography': ['5','6','7','8','9','10','11','12'], 'English': ['5','6','7','8','9','10','11','12'] },
  81: { 'Mathematics': ['10','11','12'], 'Chemistry': ['10','11','12'] },
  82: { 'Bengali': ['8','9','10','11','12'], 'History': ['8','9','10','11','12'], 'Geography': ['8','9','10','11','12'], 'Philosophy': ['8','9','10','11','12'], 'Education': ['8','9','10','11','12'] },
  83: { 'English': ['1','2','3','4'], 'Bengali': ['1','2','3','4','5'], 'Mathematics': ['1','2','3','4'] },
  84: { 'English': ['1','2','3','4','5','6','7','8','9','10'] },
  93: { 'Mathematics': ['11','12'], 'Physics': ['6','7','8'], 'Chemistry': ['6','7','8'], 'Biology': ['6','7','8'] },
  94: { 'Geography': ['9','10','11','12'], 'History': ['6','7','8','9','10','11','12'], 'Bengali': ['6','7','8','9','10','11','12'] },
  96: { 'Accountancy': ['10','11','12'], 'Economics': ['10','11','12'], 'Commerce': ['10','11','12'] },
};

// Non-academic slots for special profiles
const nonAcademicSlots: Record<number, any[]> = {
  56: [{ activity: 'Singing', ageGroups: ['All'], level: 'All levels', sessionType: 'Individual', feePerMonth: null }],
  72: [{ activity: 'Yoga', ageGroups: ['All'], level: 'All levels', sessionType: 'Both', gender: 'Both', feePerMonth: null }],
  73: [{ activity: 'Yoga', ageGroups: ['All'], level: 'All levels', sessionType: 'Offline', gender: 'Both', feePerMonth: null }],
  75: [{ activity: 'Football', ageGroups: ['All'], level: 'All levels', sessionType: 'Group', gender: 'Male', feePerMonth: null }],
  76: [{ activity: 'Skating', ageGroups: ['All'], level: 'All levels', sessionType: 'Group', gender: 'Both', feePerMonth: null }],
  85: [{ activity: 'Western Dance', ageGroups: ['All'], level: 'All levels', sessionType: 'Group', gender: 'Male', feePerMonth: null }],
};

// Reviews from SQL (cleaned - removing abusive/spam ones)
const reviews = [
  { tutorId: 25, studentName: 'Subhajyoti Paul',  rating: 5, text: 'Much experienced than many other teachers, starting every chapter of math from scratch making each easier to understand.' },
  { tutorId: 27, studentName: 'Gurpreet Singh',   rating: 5, text: 'Great teacher! Started with him from class 11th and scored very well in school, board and competitive exams.' },
  { tutorId: 27, studentName: 'Aritra Ray',        rating: 5, text: 'Started from class 11. A great teacher and motivator. He showed me the right path to my career.' },
  { tutorId: 27, studentName: 'Sukriti Biswas',   rating: 5, text: 'Being from a commerce background, I always feared Maths. With his unique teaching and guidance, I overcame that fear. Because of him I secured a position at IIM.' },
  { tutorId: 27, studentName: 'Rimpa Sengupta',   rating: 5, text: 'Great teacher!' },
  { tutorId: 27, studentName: 'Yash',             rating: 5, text: 'Great experience studying with him. Helped a lot in personal growth as well.' },
  { tutorId: 27, studentName: 'Rounak Raj',       rating: 5, text: 'Teaches from basic to advanced level and always motivates students.' },
  { tutorId: 27, studentName: 'Sourav Modak',     rating: 5, text: 'Sir always gives good advice and teaches very well. Very good hearted person.' },
  { tutorId: 25, studentName: 'Anirban',          rating: 5, text: 'Their ability to explain complex concepts simply has helped me enjoy the subject. Thanks to them I no longer fear Maths!' },
  { tutorId: 25, studentName: 'Sanjay Bhadra',   rating: 5, text: 'I like this teacher.' },
  { tutorId: 26, studentName: 'Rahul Das',        rating: 5, text: 'Excellent maths teacher. Very clear explanations and patient with students.' },
  { tutorId: 26, studentName: 'Priya Roy',        rating: 4, text: 'Good teacher. Explains concepts well.' },
  { tutorId: 24, studentName: 'Rittika Das',      rating: 5, text: 'Best Physics teacher of Alipurduar.' },
  { tutorId: 78, studentName: 'Jony',             rating: 5, text: 'Very good sir.' },
  { tutorId: 94, studentName: 'Bari',             rating: 5, text: 'Jolly and knowledgeable teacher.' },
  { tutorId: 25, studentName: 'Taj Basu',         rating: 5, text: 'The best teacher I got so far for mathematics.' },
  { tutorId: 93, studentName: 'Arnab Dey',        rating: 5, text: 'Excellent maths teacher. Very thorough and patient.' },
  { tutorId: 93, studentName: 'Suman Das',        rating: 5, text: 'Best science teacher for Class 6-8 in Alipurduar.' },
  { tutorId: 26, studentName: 'Mrinal',           rating: 5, text: 'Good teacher.' },
];

// ── Board normalization ───────────────────────────────────────────────────────
function normalizeBoards(boards: string): string[] {
  const map: Record<string, string> = { WB: 'State', CBSE: 'CBSE', CISCE: 'ICSE' };
  return boards.split(',').map(b => map[b.trim()] ?? 'Other').filter((v, i, a) => a.indexOf(v) === i);
}

// ── Generate slug ─────────────────────────────────────────────────────────────
async function genSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let i = 1;
  while (await Profile.findOne({ slug })) slug = `${base}-${i++}`;
  return slug;
}

// ── Build teaching slots ──────────────────────────────────────────────────────
function buildSlots(tutorId: number, profileType: string, boards: string) {
  const academic: any[] = [];
  const normalizedBoards = normalizeBoards(boards);
  const primaryBoard = normalizedBoards[0] ?? 'State';

  if (subjectData[tutorId]) {
    for (const [subject, classes] of Object.entries(subjectData[tutorId])) {
      academic.push({
        subject,
        classes: classes.map(c => `Class ${c}`),
        board: primaryBoard,
        medium: 'Bengali',
        feePerMonth: null,
      });
    }
  }

  const nonAcademic = nonAcademicSlots[tutorId] ?? [];

  // For arts/gym/sports with no subject data, keep non-academic slots only
  return [...academic, ...nonAcademic];
}

// ── Main migration ─────────────────────────────────────────────────────────────
async function migrate() {
  await mongoose.connect(env.MONGODB_URI);
  console.info('✅ Connected to MongoDB');

  // Clear only migrated data (keep test seed data)
  await Profile.deleteMany({ slug: { $not: /^test-/ } });
  console.info('🗑️  Cleared previous migration data');

  const passwordHash = await bcrypt.hash('DooarsTutor@2025', 12);
  const profileMap = new Map<number, string>(); // tutorId -> MongoDB profile _id

  let profilesCreated = 0;

  for (const tutor of tutors) {
    try {
      // Create user
      let user = await User.findOne({ email: tutor.email });
      if (!user) {
        user = await User.create({
          email: tutor.email,
          passwordHash,
          name: tutor.name,
          phone: tutor.phone,
          role: tutor.role === 'Organisation' ? 'org' : 'tutor',
          isVerified: true,
          isActive: true,
        });
      }

      const slots = buildSlots(tutor.id, tutor.profileType, tutor.boards);
      const subjectIndex = [...new Set(slots.map((s: any) => s.subject || s.activity).filter(Boolean))];
      const classIndex = [...new Set(slots.flatMap((s: any) => s.classes ?? []))];

      const slug = await genSlug(tutor.name);

      const profile = await Profile.create({
        userId: user._id,
        type: tutor.type,
        displayName: tutor.name,
        slug,
        bio: tutor.bio,
        teachingSlots: slots,
        _subjectIndex: subjectIndex,
        _classIndex: classIndex,
        location: { type: 'Point', coordinates: [tutor.lng, tutor.lat] },
        address: {
          line1: tutor.address,
          town: tutor.town,
          district: tutor.town,
          state: 'West Bengal',
          pincode: '736121',
        },
        contact: { phone: tutor.phone, whatsapp: tutor.phone, email: tutor.email },
        experience: tutor.exp,
        languages: ['Bengali'],
        rating: { average: tutor.rating, count: tutor.ratingCount },
        isApproved: true,
        isActive: true,
        isFeatured: false,
      });

      profileMap.set(tutor.id, String(profile._id));
      profilesCreated++;
    } catch (err: any) {
      console.warn(`⚠️  Skipped tutor ${tutor.name}: ${err.message}`);
    }
  }

  console.info(`✅ ${profilesCreated} profiles created`);

  // Create a generic reviewer user for legacy reviews
  let reviewer = await User.findOne({ email: 'migrated-reviewer@dooarstutors.com' });
  if (!reviewer) {
    reviewer = await User.create({
      email: 'migrated-reviewer@dooarstutors.com',
      passwordHash,
      name: 'Legacy Reviewer',
      role: 'student',
      isVerified: true,
      isActive: true,
    });
  }

  let reviewsCreated = 0;
  for (const r of reviews) {
    const profileId = profileMap.get(r.tutorId);
    if (!profileId) continue;
    try {
      // Check for duplicate
      const exists = await Review.findOne({ profileId, 'reviewerName': r.studentName } as any);
      if (exists) continue;

      await Review.create({
        profileId,
        reviewerId: reviewer._id,
        rating: r.rating,
        text: r.text,
        isVisible: true,
      });
      reviewsCreated++;
    } catch {
      // skip duplicates
    }
  }

  console.info(`✅ ${reviewsCreated} reviews migrated`);

  // Recalculate ratings from migrated reviews
  const profiles = await Profile.find({ isApproved: true });
  for (const profile of profiles) {
    const profileReviews = await Review.find({ profileId: profile._id, isVisible: true });
    if (profileReviews.length > 0) {
      const avg = profileReviews.reduce((s, r) => s + r.rating, 0) / profileReviews.length;
      await Profile.findByIdAndUpdate(profile._id, {
        'rating.average': Math.round(avg * 10) / 10,
        'rating.count': profileReviews.length,
      });
    }
  }

  console.info('✅ Ratings recalculated');

  console.info('\n─────────────────────────────────────────');
  console.info(`Migration complete:`);
  console.info(`  Profiles: ${profilesCreated}`);
  console.info(`  Reviews:  ${reviewsCreated}`);
  console.info(`  Login password for all migrated tutors: DooarsTutor@2025`);
  console.info('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
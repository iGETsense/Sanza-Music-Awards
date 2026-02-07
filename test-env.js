import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const key = process.env.FIREBASE_PRIVATE_KEY;
console.log('Key length:', key?.length);
console.log('Key start:', key?.substring(0, 50));
console.log('Contains literal \\n:', key?.includes('\\n'));
console.log('Contains actual newline:', key?.includes('\n'));
console.log('Reformatted key start:', key?.replace(/\\n/g, '\n').substring(0, 50));

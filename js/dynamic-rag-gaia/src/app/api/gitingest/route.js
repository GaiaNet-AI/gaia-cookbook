import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();
    
    // Execute gitingest command
    const { stdout, stderr } = await execAsync(`gitingest "${repoUrl}"`);
    
    // GitIngest creates a digest.txt file by default
    // Read the content of digest.txt
    const content = await fs.readFile('digest.txt', 'utf8');

    return NextResponse.json({ 
      content,
      output: stdout,
      error: stderr 
    });
  } catch (error) {
    console.error('GitIngest error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stderr: error.stderr 
      }, 
      { status: 500 }
    );
  }
}
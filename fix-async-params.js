const fs = require('fs');
const path = require('path');

const files = [
  'app/api/admin/users/[id]/route.ts',
  'app/api/admin/experts/[id]/route.ts',
  'app/api/admin/content/lessons/[id]/route.ts',
  'app/api/admin/content/lessons/[id]/flag/route.ts',
  'app/api/admin/content/chats/[userId]/route.ts',
  'app/api/admin/content/chats/messages/[messageId]/route.ts',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix params type declarations
  content = content.replace(
    /\{ params \}: \{ params: \{ id: string \} \}/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );
  
  content = content.replace(
    /\{ params \}: \{ params: \{ userId: string \} \}/g,
    '{ params }: { params: Promise<{ userId: string }> }'
  );
  
  content = content.replace(
    /\{ params \}: \{ params: \{ messageId: string \} \}/g,
    '{ params }: { params: Promise<{ messageId: string }> }'
  );
  
  // Add await params destructuring after try { block
  // For id parameter
  if (content.includes('params: Promise<{ id: string }>')) {
    content = content.replace(
      /(export async function (?:PUT|DELETE|PATCH|POST|GET)\([^)]+\) \{\s*try \{\s*)/g,
      (match) => {
        if (match.includes('id: string')) {
          return match + '    const { id } = await params;\n';
        }
        return match;
      }
    );
    
    // Replace params.id with id
    content = content.replace(/params\.id/g, 'id');
  }
  
  // For userId parameter
  if (content.includes('params: Promise<{ userId: string }>')) {
    content = content.replace(
      /(export async function (?:PUT|DELETE|PATCH|POST|GET)\([^)]+\) \{\s*try \{\s*)/g,
      (match) => {
        if (match.includes('userId: string')) {
          return match + '    const { userId } = await params;\n';
        }
        return match;
      }
    );
    
    // Replace params.userId with userId
    content = content.replace(/params\.userId/g, 'userId');
  }
  
  // For messageId parameter
  if (content.includes('params: Promise<{ messageId: string }>')) {
    content = content.replace(
      /(export async function (?:PUT|DELETE|PATCH|POST|GET)\([^)]+\) \{\s*try \{\s*)/g,
      (match) => {
        if (match.includes('messageId: string')) {
          return match + '    const { messageId } = await params;\n';
        }
        return match;
      }
    );
    
    // Replace params.messageId with messageId
    content = content.replace(/params\.messageId/g, 'messageId');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All files processed!');

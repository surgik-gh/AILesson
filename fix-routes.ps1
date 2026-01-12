# Fix all route handlers to use async params (Next.js 15+)

$files = @(
    "app/api/subjects/[id]/route.ts",
    "app/api/students/[id]/export/route.ts",
    "app/api/admin/users/[id]/route.ts",
    "app/api/admin/experts/[id]/route.ts",
    "app/api/admin/content/lessons/[id]/route.ts",
    "app/api/admin/content/lessons/[id]/flag/route.ts",
    "app/api/admin/content/chats/[userId]/route.ts",
    "app/api/admin/content/chats/messages/[messageId]/route.ts"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Replace params: { id: string } with params: Promise<{ id: string }>
    $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
    
    # Replace params: { userId: string } with params: Promise<{ userId: string }>
    $content = $content -replace '\{ params \}: \{ params: \{ userId: string \} \}', '{ params }: { params: Promise<{ userId: string }> }'
    
    # Replace params: { messageId: string } with params: Promise<{ messageId: string }>
    $content = $content -replace '\{ params \}: \{ params: \{ messageId: string \} \}', '{ params }: { params: Promise<{ messageId: string }> }'
    
    # Replace params.id with (await params).id
    $content = $content -replace 'params\.id', '(await params).id'
    
    # Replace params.userId with (await params).userId
    $content = $content -replace 'params\.userId', '(await params).userId'
    
    # Replace params.messageId with (await params).messageId
    $content = $content -replace 'params\.messageId', '(await params).messageId'
    
    Set-Content $file -Value $content -NoNewline
    Write-Host "Fixed: $file"
}

Write-Host "All route handlers fixed!"

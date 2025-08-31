import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DescriptionInputProps {
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
  initialTitle?: string;
  initialDescription?: string;
  frameCount: number;
}

export function DescriptionInput({ 
  onSave, 
  onCancel, 
  initialTitle = '', 
  initialDescription = '',
  frameCount 
}: DescriptionInputProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const handleSave = () => {
    if (!title.trim()) {
      return; // Don't save without a title
    }
    onSave(title.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader>
          <CardTitle className="text-center">
            Add Details
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Captured {frameCount} frames successfully
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="e.g., Library Entrance, Cafeteria Hall"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/50"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/50 characters
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              id="description"
              placeholder="Add any additional notes about this walkthrough..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/50 min-h-[80px]"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 capture-button"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DescriptionInput;
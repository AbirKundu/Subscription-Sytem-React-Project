'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface PurchasingAnimationProps {
  packageName: string;
  price: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function PurchasingAnimation({ packageName, price, onComplete, onCancel }: PurchasingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          setTimeout(() => {
            onComplete();
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Processing Purchase</CardTitle>
          <CardDescription>
            {isComplete ? 'Purchase Complete!' : `Purchasing ${packageName}...`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Package:</span>
              <span className="font-medium">{packageName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Price:</span>
              <span className="font-medium">${price}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress:</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {isComplete && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-medium">✓ Purchase Successful!</div>
              <div className="text-sm text-green-600 mt-1">
                Your subscription is now active.
              </div>
            </div>
          )}

          {!isComplete && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="w-full"
            >
              Cancel Purchase
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
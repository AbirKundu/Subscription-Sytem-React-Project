'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  onToggleMode: () => void;
}

export function RegisterForm({ onToggleMode }: AuthFormProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) return;

    setIsLoading(true);
    const result = await register(formData.email, formData.password, formData.name);
    setIsLoading(false);

    if (result) {
      // Optional: redirect to main website after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Card className="w-full max-w-md relative">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Sign up to start using our subscription service</CardDescription>
      </CardHeader>

      {/* N.B. Highlight for first-time users */}
      <div className="mb-4 p-3 rounded-md bg-yellow-100 border-l-4 border-yellow-400 animate-pulse text-yellow-900 font-medium text-sm">
        📌 <span className="font-bold">N.B.:</span> For the first time, after creating an account you will be taken to the main website automatically. Next time, you will need to log in manually.
      </div>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button onClick={onToggleMode} className="text-primary hover:underline font-medium">Sign in</button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

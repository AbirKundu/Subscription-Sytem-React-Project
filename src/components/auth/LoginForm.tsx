'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: AuthFormProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN' | null>(null);

  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setFormData({ email, password });
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(formData.email, formData.password);
    setIsLoading(false);

    if (success) {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick Login Buttons */}
        <div className="space-y-3 mb-6">
{/*           <Button
            onClick={() => handleQuickLogin('user@example.com', 'user123')}
            className="w-full"
            variant="outline"
            disabled={isLoading}
          >
            Sign in as User
          </Button> */}
          <Button
            onClick={() => handleQuickLogin('admin@example.com', 'admin123')}
            className="w-full"
            variant="outline"
            disabled={isLoading}
          >
            Sign in as Admin
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign in with email as User.
            </span>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
        
        <div className="mt-6 space-y-2 text-sm text-muted-foreground border-t pt-4">
          <p><strong>Demo Credentials:</strong></p>
          <p>Admin: admin@example.com / admin123</p>
          <p>User: user@example.com / user123</p>
          <p className="text-xs"><em>Any registered user can login with any password (demo mode)</em></p>
        </div>
      </CardContent>
    </Card>
  );
}

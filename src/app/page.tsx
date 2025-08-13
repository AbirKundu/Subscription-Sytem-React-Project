'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { PurchasingAnimation } from '@/components/ui/loading/PurchasingAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  credits: number;
  features?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserCredit {
  id: string;
  userId: string;
  packageId?: string;
  creditPackageId?: string;
  credits: number;
  remaining: number;
  expiryDate?: string;
  createdAt: string;
  package?: Package;
  creditPackage?: {
    id: string;
    name: string;
    description?: string;
    credits: number;
    price: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface Subscription {
  id: string;
  userId: string;
  packageId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  package: Package;
}

interface AdminUserData {
  userId: string;
  userName: string;
  userEmail: string;
  packageName: string;
  duration: string;
  price: number;
  credits: number;
  expiryDate: string;
  status: string;
  purchaseDate: string;
}

// interface AdminStatistics {
//   totalRevenue: number;
//   monthlyRevenue: number;
//   totalUsers: number;
//   totalSubscriptions: number;
//   totalCreditsPurchased: number;
//   activeCredits: number;
// }

// Updated statistics interface:
interface AdminStatistics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalUsers: number;
  totalSubscriptions: number;
  totalCreditsPurchased: number;
  activeCredits: number;
  activeSubscriptions: number; // Added for active subscriptions count
}

export default function Home() {
  const { user, login, logout, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);

  const [userCredits, setUserCredits] = useState<{ credits: UserCredit[]; totalCredits: number } | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [adminStatistics, setAdminStatistics] = useState<AdminStatistics | null>(null);
  const [adminUserSubscriptions, setAdminUserSubscriptions] = useState<AdminUserData[]>([]);
  const [packageStats, setPackageStats] = useState<any[]>([]);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingPackage, setPurchasingPackage] = useState<{name: string, price: number, id: string} | null>(null);
  const [showCreditCarryOverDialog, setShowCreditCarryOverDialog] = useState(false);
  const [pendingPurchasePackageId, setPendingPurchasePackageId] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [cart, setCart] = useState<Package[]>([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    credits: '',
    features: '',
    isActive: true,
  });


  useEffect(() => {
    if (user) {
      fetchPackages();
      if (user.role === 'USER') {
        fetchSubscriptions();
        fetchUserCredits();
      } else if (user.role === 'ADMIN') {
        fetchAdminData();
      }
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };



  const fetchUserCredits = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user-credits?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setAdminStatistics(data.statistics);
        setAdminUserSubscriptions(data.userSubscriptions);
        setPackageStats(data.packageStats || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchSubscriptions = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/subscriptions?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPackage,
          price: parseFloat(newPackage.price),
          duration: parseInt(newPackage.duration),
          credits: parseInt(newPackage.credits) || 0,
          features: newPackage.features ? newPackage.features.split(',').map(f => f.trim()) : [],
        }),
      });

      if (response.ok) {
        toast.success('Package created successfully!');
        setIsCreatePackageOpen(false);
        setNewPackage({
          name: '',
          description: '',
          price: '',
          duration: '',
          credits: '',
          features: '',
          isActive: true,
        });
        fetchPackages();
      } else {
        toast.error('Failed to create package');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Failed to create package');
    }
  };



  const handlePurchasePackage = async (packageId: string) => {
    if (!user) return;

    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    // Check if user has an active subscription
    const activeSubscription = subscriptions.find(sub => sub.status === 'ACTIVE');
    
    if (activeSubscription) {
      // Show confirmation dialog for credit carry-over
      setPendingPurchasePackageId(packageId);
      setShowCreditCarryOverDialog(true);
    } else {
      // No active subscription, proceed with normal purchase
      setPurchasingPackage({
        name: pkg.name,
        price: pkg.price,
        id: packageId
      });
      setIsPurchasing(true);
    }
  };

  const completePurchase = async () => {
    if (!purchasingPackage || !user) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          packageId: purchasingPackage.id,
          carryOverCredits: false, // Normal purchase, no carry-over
        }),
      });

      if (response.ok) {
        toast.success('Package purchased successfully!');
        fetchSubscriptions();
        fetchUserCredits(); // Also fetch user credits after purchase
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to purchase package');
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast.error('Failed to purchase package');
    } finally {
      setIsPurchasing(false);
      setPurchasingPackage(null);
    }
  };

  const confirmCreditCarryOverPurchase = async () => {
    if (!pendingPurchasePackageId || !user) return;

    const pkg = packages.find(p => p.id === pendingPurchasePackageId);
    if (!pkg) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          packageId: pendingPurchasePackageId,
          carryOverCredits: true, // Enable credit carry-over
        }),
      });

      if (response.ok) {
        toast.success('Package purchased successfully! Your credits have been carried over.');
        fetchSubscriptions();
        fetchUserCredits(); // Also fetch user credits after purchase
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to purchase package');
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast.error('Failed to purchase package');
    } finally {
      setShowCreditCarryOverDialog(false);
      setPendingPurchasePackageId(null);
    }
  };

  const cancelCreditCarryOverPurchase = () => {
    setShowCreditCarryOverDialog(false);
    setPendingPurchasePackageId(null);
    toast.info('Purchase cancelled');
  };

  const cancelPurchase = () => {
    setIsPurchasing(false);
    setPurchasingPackage(null);
    toast.info('Purchase cancelled');
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (response.ok) {
        toast.success('Subscription cancelled successfully!');
        fetchSubscriptions();
        fetchUserCredits(); // Also fetch user credits after cancellation
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };



  const handleTogglePackageStatus = async (packageId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(`Package ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchPackages();
      } else {
        toast.error('Failed to update package status');
      }
    } catch (error) {
      console.error('Error updating package status:', error);
      toast.error('Failed to update package status');
    }
  };

  const handleEditPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      const response = await fetch(`/api/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingPackage.name,
          description: editingPackage.description,
          price: editingPackage.price,
          duration: editingPackage.duration,
          credits: editingPackage.credits,
          features: editingPackage.features ? JSON.parse(editingPackage.features) : [],
          isActive: editingPackage.isActive,
        }),
      });

      if (response.ok) {
        toast.success('Package updated successfully!');
        setIsEditPackageOpen(false);
        setEditingPackage(null);
        fetchPackages();
      } else {
        toast.error('Failed to update package');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Package deleted successfully!');
        fetchPackages();
      } else {
        toast.error('Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  const handleAddToCart = (pkg: Package) => {
    setCart(prevCart => {
      // Check if package is already in cart
      const existingItem = prevCart.find(item => item.id === pkg.id);
      if (existingItem) {
        toast.info('Package is already in your cart');
        return prevCart;
      }
      toast.success('Package added to cart!');
      return [...prevCart, pkg];
    });
  };

  const handleRemoveFromCart = (packageId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== packageId));
    toast.info('Package removed from cart');
  };

  const handlePurchaseFromCart = async (packageId: string) => {
    const pkg = cart.find(item => item.id === packageId);
    if (!pkg) return;

    // Remove from cart first
    handleRemoveFromCart(packageId);
    
    // Then proceed with purchase
    handlePurchasePackage(packageId);
  };

  const handlePurchaseAllFromCart = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Purchase packages one by one
    for (const pkg of cart) {
      await handlePurchasePackage(pkg.id);
    }
    
    // Clear cart after all purchases
    setCart([]);
  };

  const handleDeleteAllSubscriptions = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete all your subscription history? This action cannot be undone and will reset all your credits to 0.')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/delete-all?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('All subscription history deleted successfully!');
        fetchSubscriptions();
        fetchUserCredits();
        setSelectedSubscriptions([]);
      } else {
        toast.error('Failed to delete subscription history');
      }
    } catch (error) {
      console.error('Error deleting all subscriptions:', error);
      toast.error('Failed to delete subscription history');
    }
  };

  const handleDeleteSelectedSubscriptions = async () => {
    if (!user || selectedSubscriptions.length === 0) {
      toast.error('Please select subscriptions to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSubscriptions.length} subscription(s)? This action cannot be undone and will reset their credits to 0.`)) {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/delete-selected', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionIds: selectedSubscriptions,
        }),
      });

      if (response.ok) {
        toast.success('Selected subscriptions deleted successfully!');
        fetchSubscriptions();
        fetchUserCredits();
        setSelectedSubscriptions([]);
      } else {
        toast.error('Failed to delete selected subscriptions');
      }
    } catch (error) {
      console.error('Error deleting selected subscriptions:', error);
      toast.error('Failed to delete selected subscriptions');
    }
  };

  const handleToggleSubscriptionSelection = (subscriptionId: string) => {
    setSelectedSubscriptions(prev => 
      prev.includes(subscriptionId) 
        ? prev.filter(id => id !== subscriptionId)
        : [...prev, subscriptionId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        {isLoginMode ? (
          <LoginForm onToggleMode={() => setIsLoginMode(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLoginMode(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isPurchasing && purchasingPackage && (
        <PurchasingAnimation
          packageName={purchasingPackage.name}
          price={purchasingPackage.price}
          onComplete={completePurchase}
          onCancel={cancelPurchase}
        />
      )}
      
      {/* Credit Carry-over Confirmation Dialog */}
      <Dialog open={showCreditCarryOverDialog} onOpenChange={setShowCreditCarryOverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm New Package Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to buy a new plan? Your current credits will be added to the new plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelCreditCarryOverPurchase}>
              Cancel
            </Button>
            <Button onClick={confirmCreditCarryOverPurchase}>
              Confirm Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Subscription Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name} ({user.role})
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user.role === 'ADMIN' ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            
            {/* Statistics Cards */}
            {adminStatistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <div className="h-4 w-4 text-muted-foreground">💰</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${adminStatistics.totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <div className="h-4 w-4 text-muted-foreground">📈</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${adminStatistics.monthlyRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
               <Card>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">👥</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStatistics.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">
                    {adminStatistics.totalUsers - adminUserSubscriptions.filter(s => s.status === 'ACTIVE').length} users without active subscription
                  </div>
                </CardContent>
              </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {adminUserSubscriptions.filter(s => s.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>


              </div>
            )}
            
            <Tabs defaultValue="packages" className="w-full">
              <TabsList>
                <TabsTrigger value="packages">Subscription Packages</TabsTrigger>
                <TabsTrigger value="analytics">Package Analytics</TabsTrigger>
                <TabsTrigger value="users">User Subscriptions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="packages" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Manage Subscription Packages</h3>
                  <Dialog open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
                    <DialogTrigger asChild>
                      <Button>Create New Package</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Package</DialogTitle>
                        <DialogDescription>
                          Create a new subscription package for users to purchase.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreatePackage} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Package Name</Label>
                          <Input
                            id="name"
                            value={newPackage.name}
                            onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newPackage.description}
                            onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newPackage.price}
                            onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (days)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={newPackage.duration}
                            onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="credits">Credits Included</Label>
                          <Input
                            id="credits"
                            type="number"
                            value={newPackage.credits}
                            onChange={(e) => setNewPackage({ ...newPackage, credits: e.target.value })}
                            placeholder="Number of credits included"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="features">Features (comma-separated)</Label>
                          <Input
                            id="features"
                            value={newPackage.features}
                            onChange={(e) => setNewPackage({ ...newPackage, features: e.target.value })}
                            placeholder="Feature 1, Feature 2, Feature 3"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            checked={newPackage.isActive}
                            onCheckedChange={(checked) => setNewPackage({ ...newPackage, isActive: checked })}
                          />
                          <Label htmlFor="isActive">Active</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          Create Package
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Edit Package Dialog */}
                <Dialog open={isEditPackageOpen} onOpenChange={setIsEditPackageOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Package</DialogTitle>
                      <DialogDescription>
                        Update the subscription package details.
                      </DialogDescription>
                    </DialogHeader>
                    {editingPackage && (
                      <form onSubmit={handleEditPackage} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="editName">Package Name</Label>
                          <Input
                            id="editName"
                            value={editingPackage.name}
                            onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editDescription">Description</Label>
                          <Textarea
                            id="editDescription"
                            value={editingPackage.description || ''}
                            onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editPrice">Price ($)</Label>
                          <Input
                            id="editPrice"
                            type="number"
                            step="0.01"
                            value={editingPackage.price}
                            onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editDuration">Duration (days)</Label>
                          <Input
                            id="editDuration"
                            type="number"
                            value={editingPackage.duration}
                            onChange={(e) => setEditingPackage({ ...editingPackage, duration: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editCredits">Credits Included</Label>
                          <Input
                            id="editCredits"
                            type="number"
                            value={editingPackage.credits}
                            onChange={(e) => setEditingPackage({ ...editingPackage, credits: parseInt(e.target.value) })}
                            placeholder="Number of credits included"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editFeatures">Features (comma-separated)</Label>
                          <Input
                            id="editFeatures"
                            value={editingPackage.features ? JSON.parse(editingPackage.features).join(', ') : ''}
                            onChange={(e) => setEditingPackage({ ...editingPackage, features: JSON.stringify(e.target.value.split(',').map(f => f.trim())) })}
                            placeholder="Feature 1, Feature 2, Feature 3"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="editIsActive"
                            checked={editingPackage.isActive}
                            onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, isActive: checked })}
                          />
                          <Label htmlFor="editIsActive">Active</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          Update Package
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className={`${!pkg.isActive ? 'opacity-50' : ''}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{pkg.name}</CardTitle>
                          <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                            {pkg.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-2xl font-bold">${pkg.price}</div>
                          <div className="text-sm text-muted-foreground">
                            {pkg.duration} days
                          </div>
                          {pkg.credits > 0 && (
                            <div className="text-sm text-green-600 font-medium">
                              +{pkg.credits} credits included
                            </div>
                          )}
                          {pkg.features && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium">Features:</div>
                              <div className="text-sm text-muted-foreground">
                                {JSON.parse(pkg.features).join(', ')}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Switch
                              checked={pkg.isActive}
                              onCheckedChange={(checked) => handleTogglePackageStatus(pkg.id, checked)}
                            />
                            <span className="text-sm">
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPackage(pkg);
                                setIsEditPackageOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePackage(pkg.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Package Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">Package Analytics</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive insights into subscription package performance</p>
                  </div>
                  <Button variant="outline" onClick={fetchAdminData}>
                    Refresh Data
                  </Button>
                </div>

                {/* Package Overview Cards */}
                {packageStats.length > 0 && (
                  <div className="grid gap-6">
                    {packageStats.map((pkg) => (
                      <Card key={pkg.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {pkg.name}
                                {!pkg.isActive && (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{pkg.description}</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">${pkg.price}</div>
                              <div className="text-sm text-muted-foreground">{pkg.duration} days</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Subscription Stats */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Subscriptions</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total:</span>
                                  <span className="font-medium">{pkg.stats.totalSubscriptions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className="font-medium text-green-600">{pkg.stats.activeSubscriptions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Expired:</span>
                                  <span className="font-medium text-yellow-600">{pkg.stats.expiredSubscriptions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Cancelled:</span>
                                  <span className="font-medium text-red-600">{pkg.stats.cancelledSubscriptions}</span>
                                </div>
                              </div>
                            </div>

                            {/* Revenue Stats */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Revenue</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Revenue:</span>
                                  <span className="font-medium">${pkg.stats.totalRevenue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Avg per User:</span>
                                  <span className="font-medium">${pkg.stats.averageRevenuePerUser.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Unique Users:</span>
                                  <span className="font-medium">{pkg.stats.uniqueUsers}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Conversion:</span>
                                  <span className="font-medium">{pkg.stats.conversionRate.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Credits Stats */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Credits</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Package Credits:</span>
                                  <span className="font-medium">{pkg.credits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Granted:</span>
                                  <span className="font-medium">{pkg.stats.totalCreditsGranted}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className="font-medium text-green-600">{pkg.stats.activeCredits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Used:</span>
                                  <span className="font-medium text-red-600">{pkg.stats.usedCredits}</span>
                                </div>
                              </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Recent Activity</h4>
                              <div className="space-y-2 text-sm">
                                {pkg.recentActivity.length > 0 ? (
                                  pkg.recentActivity.map((activity: any, index: number) => (
                                    <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                                      <div className="font-medium">{activity.userName}</div>
                                      <div className="text-muted-foreground">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                      </div>
                                      <Badge 
                                        variant={
                                          activity.status === 'ACTIVE' ? 'default' :
                                          activity.status === 'EXPIRED' ? 'secondary' : 'destructive'
                                        }
                                        className="text-xs mt-1"
                                      >
                                        {activity.status}
                                      </Badge>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-muted-foreground text-xs">No recent activity</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Package Features */}
                          {pkg.features && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-medium text-sm mb-2">Features</h4>
                              <div className="flex flex-wrap gap-2">
                                {JSON.parse(pkg.features).map((feature: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                         
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {packageStats.length === 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        No package data available. Create some packages to see analytics.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* User Subscriptions Tab */}
              <TabsContent value="users" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">User Subscription Review</h3>
                    <p className="text-sm text-muted-foreground">View all user subscriptions and their details</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAdminData}>
                      Refresh
                    </Button>
                    <Button>View All</Button>
                  </div>
                </div>
                
                <div className="border rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-4 font-medium">User</th>
                          <th className="text-left p-4 font-medium">Package</th>
                          <th className="text-left p-4 font-medium">Duration</th>
                          <th className="text-left p-4 font-medium">Price</th>
                          <th className="text-left p-4 font-medium">Credits</th>
                          <th className="text-left p-4 font-medium">Expiry Date</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Purchase Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUserSubscriptions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-muted-foreground">
                              No subscription data available
                            </td>
                          </tr>
                        ) : (
                          adminUserSubscriptions.map((subscription, index) => (
                            <tr key={`${subscription.userId}-${index}`} className="border-b hover:bg-muted/50">
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{subscription.userName}</div>
                                  <div className="text-sm text-muted-foreground">{subscription.userEmail}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium">{subscription.packageName}</div>
                              </td>
                              <td className="p-4">{subscription.duration}</td>
                              <td className="p-4">${subscription.price}</td>
                              <td className="p-4">{subscription.credits}</td>
                              <td className="p-4">{new Date(subscription.expiryDate).toLocaleDateString()}</td>
                              <td className="p-4">
                                <Badge variant={
                                  subscription.status === 'ACTIVE' ? 'default' :
                                  subscription.status === 'EXPIRED' ? 'secondary' : 'destructive'
                                }>
                                  {subscription.status}
                                </Badge>
                              </td>
                              <td className="p-4">{new Date(subscription.purchaseDate).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                

                
                {/* Additional Stats */}
                {adminStatistics && (
                 <div className="grid grid-cols-1 gap-4">
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Subscription Status</CardTitle>
                      </CardHeader>
                      <CardContent>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-600">Active Subscriptions:  </span>
                            <span className="font-medium text-green-600">
                              {adminUserSubscriptions.filter(s => s.status === 'ACTIVE').length}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Expired Subscriptions:  </span>
                            <span className="font-medium text-secondary">
                              {adminUserSubscriptions.filter(s => s.status === 'EXPIRED').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-destructive">Cancelled Subscriptions:  </span>
                            <span className="font-medium text-destructive">
                              {adminUserSubscriptions.filter(s => s.status === 'CANCELLED').length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    
                  </div>
                )}
              </TabsContent>
              

            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">User Dashboard</h2>
              {userCredits && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Available Credits</div>
                  <div className="text-2xl font-bold text-green-600">{userCredits.totalCredits}</div>
                </div>
              )}
            </div>
            
            <Tabs defaultValue="home" className="w-full">
              <TabsList>
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="packages">Subscription Packages</TabsTrigger>
                <TabsTrigger value="current-plan">Current Plan</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              


              {/* Home Page */}
              <TabsContent value="home" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to Your Dashboard</CardTitle>
                    <CardDescription>Here's a quick overview of your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{userCredits?.totalCredits || 0}</div>
                        <div className="text-sm text-muted-foreground">Available Credits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {subscriptions.filter(s => s.status === 'ACTIVE').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {subscriptions.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Subscriptions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              



              {/* Subscription Packages Page */}
              <TabsContent value="packages" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.filter(pkg => pkg.isActive).map((pkg) => (
                    <Card key={pkg.id}>
                      <CardHeader>
                        <CardTitle>{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-2xl font-bold">${pkg.price}</div>
                          <div className="text-sm text-muted-foreground">
                            {pkg.duration} days
                          </div>
                          {pkg.credits > 0 && (
                            <div className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                              +{pkg.credits} credits included
                            </div>
                          )}
                          {pkg.features && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium">Features:</div>
                              <div className="text-sm text-muted-foreground">
                                {JSON.parse(pkg.features).join(', ')}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handlePurchasePackage(pkg.id)}
                              className="flex-1"
                            >
                              Purchase Now
                            </Button>
                            <Button 
                              onClick={() => handleAddToCart(pkg)}
                              variant="outline"
                              className="flex-1"
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              



              <div className="mt-6"></div>
                {/* Cart Section - Show only if cart has items */}
                {cart.length > 0 && (
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                      <CardTitle>Shopping Cart ({cart.length})</CardTitle>
                      <CardDescription>Review your selected packages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">${item.price} - {item.duration} days</div>
                              {item.credits > 0 && (
                                <div className="text-sm text-green-600">+{item.credits} credits</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handlePurchaseFromCart(item.id)}
                                size="sm"
                              >
                                Purchase
                              </Button>
                              <Button 
                                onClick={() => handleRemoveFromCart(item.id)}
                                variant="outline"
                                size="sm"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-lg font-semibold">
                            Total: ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                          </div>
                          <Button onClick={handlePurchaseAllFromCart}>
                            Purchase All
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              



              {/* Current Plan Page */}
              <TabsContent value="current-plan" className="space-y-4">
                {(() => {
                  const activeSubscription = subscriptions.find(sub => sub.status === 'ACTIVE');
                  if (!activeSubscription) {
                    return (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">
                            You don't have an active subscription. Purchase a package to get started.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  const subscriptionCredits = userCredits?.credits.filter(c => c.packageId === activeSubscription.packageId) || [];
                  const totalCredits = subscriptionCredits.reduce((sum, credit) => sum + credit.remaining, 0);
                  
                  return (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Current Plan Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Plan Name</div>
                              <div className="text-lg font-semibold">{activeSubscription.package.name}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Credits Remaining</div>
                              <div className="text-lg font-semibold text-green-600">{totalCredits}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Expiry Date</div>
                              <div className="text-lg font-semibold">{new Date(activeSubscription.endDate).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Status</div>
                              <div className="text-lg font-semibold text-green-600">Active</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Plan Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Price:</strong> ${activeSubscription.package.price}
                            </div>
                            <div className="text-sm">
                              <strong>Duration:</strong> {activeSubscription.package.duration} days
                            </div>
                            {activeSubscription.package.credits > 0 && (
                              <div className="text-sm">
                                <strong>Total Credits:</strong> {activeSubscription.package.credits}
                              </div>
                            )}
                            {activeSubscription.package.features && (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">Features:</div>
                                <div className="text-sm text-muted-foreground">
                                  {JSON.parse(activeSubscription.package.features).join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelSubscription(activeSubscription.id)}
                        >
                          Cancel Subscription
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>
              
              {/* History Page */}
              <TabsContent value="history" className="space-y-4">
                {subscriptions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        You don't have any subscription history yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Subscription History</h3>
                      <div className="flex gap-2">
                        {selectedSubscriptions.length > 0 && (
                          <Button 
                            onClick={handleDeleteSelectedSubscriptions}
                            variant="destructive"
                            size="sm"
                          >
                            Delete Selected ({selectedSubscriptions.length})
                          </Button>
                        )}
                        <Button 
                          onClick={handleDeleteAllSubscriptions}
                          variant="destructive"
                          size="sm"
                        >
                          Delete All
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {subscriptions.map((subscription) => {
                        const subscriptionCredits = userCredits?.credits.filter(c => c.packageId === subscription.packageId) || [];
                        const totalCredits = subscriptionCredits.reduce((sum, credit) => sum + credit.credits, 0);
                        const isSelected = selectedSubscriptions.includes(subscription.id);
                        
                        return (
                          <Card key={subscription.id} className={`transition-colors ${isSelected ? 'ring-2 ring-destructive' : ''}`}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSubscriptionSelection(subscription.id)}
                                    className="mt-1"
                                    aria-label={`Select subscription for ${subscription.package.name}`}
                                  />
                                  <div>
                                    <CardTitle className="text-lg">{subscription.package.name}</CardTitle>
                                    <CardDescription>
                                      {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                                    </CardDescription>
                                  </div>
                                </div>
                                <Badge variant={
                                  subscription.status === 'ACTIVE' ? 'default' :
                                  subscription.status === 'EXPIRED' ? 'secondary' : 'destructive'
                                }>
                                  {subscription.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Package</div>
                                  <div>{subscription.package.name}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Credits</div>
                                  <div>{totalCredits}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Price</div>
                                  <div>${subscription.package.price}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Date</div>
                                  <div>{new Date(subscription.startDate).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
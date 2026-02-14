import React, { useState } from "react";
import {
  User as UserIcon,
  Lock,
  Bell,
  Building2,
  CircleDollarSign,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

type SettingsTab = "profile" | "security" | "role" | "notifications";

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [avatar, setAvatar] = useState(user?.avatarUrl || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Entrepreneur-specific state
  const [startupName, setStartupName] = useState(user?.startupName || "");
  const [pitchSummary, setPitchSummary] = useState(user?.pitchSummary || "");
  const [industry, setIndustry] = useState(user?.industry || "");
  const [fundingNeeded, setFundingNeeded] = useState(user?.fundingNeeded || "");

  // Investor-specific state
  const [investmentInterests, setInvestmentInterests] = useState(
    user?.investmentInterests?.join(", ") || "",
  );
  const [minInvestment, setMinInvestment] = useState(
    user?.minimumInvestment || "",
  );
  const [maxInvestment, setMaxInvestment] = useState(
    user?.maximumInvestment || "",
  );

  // 2FA state
  const { setup2FA, enable2FA, disable2FA } = useAuth();
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState("");

  if (!user) return null;

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile(user.id, { name, bio, location, avatarUrl: avatar });
    } catch {
      // Error handled by context
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error("File size exceeds 800KB limit");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateRoleSettings = async () => {
    setIsUpdatingProfile(true);
    try {
      if (user.role === "entrepreneur") {
        await updateProfile(user.id, {
          startupName,
          pitchSummary,
          industry,
          fundingNeeded,
        });
      } else {
        await updateProfile(user.id, {
          investmentInterests: investmentInterests
            .split(",")
            .map((i) => i.trim()),
          minimumInvestment: minInvestment,
          maximumInvestment: maxInvestment,
        });
      }
    } catch {
      // Error handled by context
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    console.log("[DEBUG] Changing password for user:", user.id);
    try {
      await changePassword(currentPassword, newPassword);
      console.log("[DEBUG] Password change successful");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("[DEBUG] Password change failed:", error);
      // Error handled by context
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSetup2FA = async () => {
    setIs2FALoading(true);
    try {
      await setup2FA();
      setShow2FAVerify(true);
    } catch {
      // Error handled by context
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorOtp) {
      toast.error("Please enter the verification code");
      return;
    }
    setIs2FALoading(true);
    try {
      await enable2FA(twoFactorOtp);
      setShow2FAVerify(false);
      setTwoFactorOtp("");
    } catch {
      // Error handled by context
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disable two-factor authentication?",
      )
    ) {
      return;
    }
    setIs2FALoading(true);
    try {
      await disable2FA();
    } catch {
      // Error handled by context
    } finally {
      setIs2FALoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and professional details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "profile"
                    ? "text-primary-700 bg-primary-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <UserIcon size={18} className="mr-3" />
                Basic Profile
              </button>

              <button
                onClick={() => setActiveTab("role")}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "role"
                    ? "text-primary-700 bg-primary-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {user.role === "entrepreneur" ? (
                  <>
                    <Building2 size={18} className="mr-3" /> Startup Details
                  </>
                ) : (
                  <>
                    <CircleDollarSign size={18} className="mr-3" /> Investment
                    Preferences
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "security"
                    ? "text-primary-700 bg-primary-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Lock size={18} className="mr-3" />
                Security
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "notifications"
                    ? "text-primary-700 bg-primary-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bell size={18} className="mr-3" />
                Notifications
              </button>
            </nav>
          </CardBody>
        </Card>

        {/* Main settings content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Basic Profile
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar src={avatar} alt={user.name} size="xl" />
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Photo
                    </Button>
                    <p className="mt-2 text-sm text-gray-500">
                      JPG, GIF or PNG. Max size of 800K
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={user.email}
                    disabled
                  />
                  <Input
                    label="Role"
                    value={user.role}
                    disabled
                    className="capitalize"
                  />
                  <Input
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(user.name);
                      setBio(user.bio || "");
                      setLocation(user.location || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    isLoading={isUpdatingProfile}
                  >
                    Save Profile
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === "role" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  {user.role === "entrepreneur"
                    ? "Startup Details"
                    : "Investment Preferences"}
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                {user.role === "entrepreneur" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Startup Name"
                        value={startupName}
                        onChange={(e) => setStartupName(e.target.value)}
                      />
                      <Input
                        label="Industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                      />
                      <Input
                        label="Funding Needed"
                        value={fundingNeeded}
                        onChange={(e) => setFundingNeeded(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pitch Summary
                      </label>
                      <textarea
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        rows={4}
                        value={pitchSummary}
                        onChange={(e) => setPitchSummary(e.target.value)}
                        placeholder="Briefly describe your startup's mission and value proposition..."
                      ></textarea>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Min Investment"
                        value={minInvestment}
                        onChange={(e) => setMinInvestment(e.target.value)}
                      />
                      <Input
                        label="Max Investment"
                        value={maxInvestment}
                        onChange={(e) => setMaxInvestment(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        label="Investment Interests (comma separated)"
                        value={investmentInterests}
                        onChange={(e) => setInvestmentInterests(e.target.value)}
                        placeholder="e.g. Fintech, AI, Sustanability"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleUpdateRoleSettings}
                    isLoading={isUpdatingProfile}
                  >
                    Save Details
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Security Settings
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Change Password
                  </h3>
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isChangingPassword}>
                      Update Password
                    </Button>
                  </div>
                </form>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Add an extra layer of security to your account
                        </p>
                        <Badge
                          variant={
                            user.isTwoFactorEnabled ? "success" : "error"
                          }
                          className="mt-1"
                        >
                          {user.isTwoFactorEnabled ? "Enabled" : "Not Enabled"}
                        </Badge>
                      </div>
                      {user.isTwoFactorEnabled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDisable2FA}
                          isLoading={is2FALoading}
                        >
                          Disable
                        </Button>
                      ) : !show2FAVerify ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSetup2FA}
                          isLoading={is2FALoading}
                        >
                          Enable
                        </Button>
                      ) : null}
                    </div>

                    {show2FAVerify && !user.isTwoFactorEnabled && (
                      <div className="pt-4 border-t border-gray-200 animate-slide-up">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Verify Social Email OTP
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          We've sent a 6-digit code to{" "}
                          <strong>{user.email}</strong>. Please enter it below
                          to complete the setup.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full max-w-lg">
                          <div className="flex-1 w-full sm:w-auto">
                            <Input
                              placeholder="000000"
                              value={twoFactorOtp}
                              onChange={(e) => setTwoFactorOtp(e.target.value)}
                              maxLength={6}
                              className="w-full sm:w-32 text-center tracking-[0.5em] font-mono text-xl"
                            />
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              onClick={handleVerify2FA}
                              isLoading={is2FALoading}
                              className="flex-1 sm:flex-none"
                            >
                              Verify & Enable
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShow2FAVerify(false)}
                              className="flex-1 sm:flex-none"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Notifications
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {[
                    {
                      label: "Email Notifications",
                      desc: "Receive emails for new messages and requests",
                    },
                    {
                      label: "Push Notifications",
                      desc: "Receive browser notifications for activity",
                    },
                    {
                      label: "Marketing Emails",
                      desc: "Receive news and product updates",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() =>
                        toast.success("Notification preferences saved")
                      }
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

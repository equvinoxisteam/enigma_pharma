import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Lock, Bell, Globe, Palette, Save } from 'lucide-react';
import { profileAPI } from '../api/profileAPI';

const SettingsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState('account');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    password: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: {
      rfqRequests: true,
      invitations: true,
      statusChanges: true,
      chatMessages: true,
      shipments: true
    },
    inAppNotifications: {
      rfqRequests: true,
      invitations: true,
      statusChanges: true,
      chatMessages: true,
      shipments: true
    },
    preferences: {
      currency: user?.buyerSettings?.preferredCurrency || 'USD',
      language: 'English',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: 'light'
    }
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await profileAPI.getSettings();
        if (response?.success && response?.data) {
          setSettings((prev) => ({
            ...prev,
            emailNotifications: response.data.emailNotifications || prev.emailNotifications,
            inAppNotifications: response.data.inAppNotifications || prev.inAppNotifications,
            preferences: {
              ...prev.preferences,
              ...(response.data.preferences || {})
            }
          }));
        }
      } catch (error) {
        showError('Failed to load settings');
      }
    };
    fetchSettings();
  }, [showError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!settings.password || !settings.newPassword || !settings.confirmPassword) {
      showError('Please fill all password fields');
      return;
    }
    if (settings.newPassword !== settings.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await profileAPI.changePassword({
        currentPassword: settings.password,
        newPassword: settings.newPassword,
        confirmPassword: settings.confirmPassword
      });
      if (response.success) {
        showSuccess('Password updated successfully');
        setSettings((prev) => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    setLoading(true);
    try {
      const payload = {
        emailNotifications: settings.emailNotifications,
        inAppNotifications: settings.inAppNotifications,
        preferences: settings.preferences
      };
      await profileAPI.updateSettings(payload);
      showSuccess(`${section} settings saved successfully`);
    } catch (error) {
      let errorMessage = 'Failed to save settings. Please try again.';
      const errorData = error.response?.data?.message || '';
      
      if (errorData.includes('Cast to Object failed')) {
        errorMessage = 'Some account data is in an incorrect format. Please refresh the page and try again.';
      } else if (errorData.includes('billingInfo')) {
        errorMessage = 'There was an issue saving your billing preferences. Please contact support if this persists.';
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'account', label: 'Account & Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Section Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max sm:min-w-0">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center px-4 sm:px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-[#4881F8] text-[#4881F8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account & Security */}
        {activeSection === 'account' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={settings.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={settings.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={settings.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors"
                >
                  Update Password
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
              <div className="space-y-3">
                {Object.keys(settings.emailNotifications).map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={`emailNotifications.${key}`}
                        checked={settings.emailNotifications[key]}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4881F8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4881F8]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">In-App Notifications</h3>
              <div className="space-y-3">
                {Object.keys(settings.inAppNotifications).map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={`inAppNotifications.${key}`}
                        checked={settings.inAppNotifications[key]}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4881F8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4881F8]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => handleSave('notifications')}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                Save Notification Settings
              </button>
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeSection === 'preferences' && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                name="preferences.currency"
                value={settings.preferences.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="CNY">CNY - Chinese Yuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                name="preferences.language"
                value={settings.preferences.language}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              >
                <option value="English">English</option>
                <option value="German">German</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <select
                name="preferences.timezone"
                value={settings.preferences.timezone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              >
                <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UI Theme
              </label>
              <select
                name="preferences.theme"
                value={settings.preferences.theme}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => handleSave('preferences')}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;


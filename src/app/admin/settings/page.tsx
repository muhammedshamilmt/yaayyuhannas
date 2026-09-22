import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export default function SettingsPage() {
  return (
    <>
      <Breadcrumb pageName="Settings" />

      <div className="space-y-6">
        {/* Festival Settings */}
        <ShowcaseSection title="Festival Settings">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Festival Name
                </label>
                <input
                  type="text"
                  defaultValue="Wattaqa Arts Festival 2K25"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Festival Year
                </label>
                <input
                  type="text"
                  defaultValue="2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  defaultValue="2025-03-10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  defaultValue="2025-03-16"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                defaultValue="Wattaqa School Campus"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Festival Description
              </label>
              <textarea
                rows={3}
                defaultValue="Annual arts and sports festival celebrating creativity, talent, and teamwork among students."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Save Festival Settings
            </button>
          </form>
        </ShowcaseSection>

        {/* Team Management Settings */}
        <ShowcaseSection title="Team Management Settings">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Team Portal Access</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Sumud Portal</p>
                      <p className="text-sm text-gray-600">Access to team dashboard and submissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <button className="text-gray-600 hover:text-gray-900 text-sm">Configure</button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">A</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Aqsa Portal</p>
                      <p className="text-sm text-gray-600">Access to team dashboard and submissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <button className="text-gray-600 hover:text-gray-900 text-sm">Configure</button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold text-sm">I</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Team Inthifada Portal</p>
                      <p className="text-sm text-gray-600">Access to team dashboard and submissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <button className="text-gray-600 hover:text-gray-900 text-sm">Configure</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Portal Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Team Registration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Event Submissions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Results Viewing</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Team Rankings</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Schedule Access</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Gallery Upload</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Team Chat</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        {/* Website Settings */}
        <ShowcaseSection title="Website Settings">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Title
                </label>
                <input
                  type="text"
                  defaultValue="Festival 2K25 - Wattaqa Arts Festival"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  defaultValue="info@wattaqafestival.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Status
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="website_status" value="live" className="border-gray-300" defaultChecked />
                  <span className="text-sm text-gray-700">Live - Website is publicly accessible</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="website_status" value="maintenance" className="border-gray-300" />
                  <span className="text-sm text-gray-700">Maintenance - Show maintenance page</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="website_status" value="private" className="border-gray-300" />
                  <span className="text-sm text-gray-700">Private - Require login to access</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Public Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Show Live Rankings</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Show Event Schedule</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Show Gallery</span>
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    <span className="text-sm text-gray-700">Show Team Information</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Allow Public Registration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Show Contact Form</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        {/* System Settings */}
        <ShowcaseSection title="System Settings">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700">
                  <option value="UTC">UTC</option>
                  <option value="Asia/Dubai" selected>Asia/Dubai (GMT+4)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700">
                  <option value="en" selected>English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Data Management</h3>
              <div className="flex space-x-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Export All Data
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                  Backup Database
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Reset Festival Data
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Save All Settings
              </button>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}
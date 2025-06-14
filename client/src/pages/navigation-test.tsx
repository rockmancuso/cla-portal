import NavigationMenu from "@/components/navigation-menu";

export default function NavigationTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Navigation Menu */}
      <NavigationMenu />
      
      {/* Test Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">CLA</span>
              </div>
              <div>
                <h1 className="uppercase text-3xl font-bold text-white">Member Portal</h1>
                <p className="text-blue-100 text-sm">Connect. Learn. Advocate.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Navigation Menu Test Page
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            This page demonstrates the new horizontal navigation menu that has been added to the top of the app.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Navigation Menu Features:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Horizontal menu bar at the top of the page</li>
              <li>Six navigation items with external links to CLA member resources</li>
              <li>Responsive design that collapses to a mobile menu on smaller screens</li>
              <li>Clean styling that matches the existing app design</li>
              <li>All links open in the same window/tab as requested</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6">Menu Items:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>My Profile</strong> - Links to member profile page</li>
              <li><strong>Update Profile</strong> - Links to profile update page</li>
              <li><strong>Store</strong> - Links to CLA store</li>
              <li><strong>Resources</strong> - Links to member resources</li>
              <li><strong>CLAdvantage Rewards</strong> - Links to rewards program</li>
              <li><strong>CLA Business Solutions</strong> - Links to business solutions</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
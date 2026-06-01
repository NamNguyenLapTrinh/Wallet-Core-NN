require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Load Nitrogen's autolinking helper. Must run BEFORE Pod::Spec.new — that's
# the canonical Nitro setup. The helper uses paths RELATIVE TO THE PODSPEC,
# so the podspec MUST live at the module root (this file), not in ios/.
load File.join(__dir__, 'nitrogen', 'generated', 'ios', 'WalletManagerModule+autolinking.rb')

Pod::Spec.new do |s|
  s.name         = 'WalletManagerModule'
  s.version      = package['version']
  s.summary      = 'Wallet management layer wrapping Trust Wallet Core via Nitro Modules'
  s.homepage     = 'https://example.com/wallet-manager-module'
  s.license      = 'MIT'
  s.author       = { 'You' => 'tech@mey.network' }
  s.platforms    = { :ios => '13.0' }
  s.source       = { :path => '.' }

  # Hand-written C++ sources live in ./cpp. add_nitrogen_files appends the
  # nitrogen-generated tree below.
  s.source_files = ['cpp/**/*.{hpp,cpp}']
  s.public_header_files = ['cpp/**/*.hpp']

  # Vendored TrustWalletCore — produced by scripts/build-wallet-core.sh which
  # runs the wallet-core repo's official `tools/ios-build`, then copies the
  # resulting xcframework + headers into ios/vendor/. Both are committed to
  # this repo. No external CocoaPod, no fetch at `pod install` time.
  s.vendored_frameworks = 'ios/vendor/WalletCoreCommon.xcframework'
  s.preserve_paths     = ['ios/vendor/**/*']

  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => [
      '"$(PODS_TARGET_SRCROOT)/cpp"',
      '"$(PODS_TARGET_SRCROOT)/ios/vendor/include"',
    ].join(' '),
    'OTHER_LDFLAGS' => '-lc++ -lc++abi',
  }

  s.dependency 'React-Core'
  s.dependency 'React-callinvoker'

  # Appends:
  #  - nitrogen/generated/shared/**, nitrogen/generated/ios/**
  #  - SWIFT_OBJC_INTEROP_MODE=objcxx, DEFINES_MODULE, CLANG_CXX_LANGUAGE_STANDARD
  #  - NitroModules dependency
  add_nitrogen_files(s)
end

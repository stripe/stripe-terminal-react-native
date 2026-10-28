require 'json'
require_relative 'ios/StripeTerminalSPMEmbedding'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'stripe-terminal-react-native'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { ios: '16.0' }
  s.source       = { git: 'https://github.com/stripe/stripe-terminal-react-native.git', tag: s.version.to_s }

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.exclude_files = 'ios/Tests/'
  s.xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'SCP_USB_ENABLED=1' }
  # Compile against the StripeTerminal package processed for the app target.
  s.pod_target_xcconfig = { 'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)"' }
  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'ios/Tests/**/*.{m,swift}'
    test_spec.libraries = 'c++'
  end

  s.dependency 'React-Core'
  local_spm_url = File.expand_path('../localSwiftPackage', __dir__)
  public_spm_url = 'https://github.com/stripe/stripe-terminal-ios-spm'
  spm_url = File.exist?(File.join(local_spm_url, 'Package.swift')) ? local_spm_url : public_spm_url
  spm_requirement = {
    kind: 'upToNextMinorVersion',
    minimumVersion: '6.0.0',
  }
  spm_products = ['StripeTerminal']

  if spm_url == local_spm_url
    Pod::UI.puts "[StripeTerminal] Using local iOS SDK package at #{local_spm_url}"
  else
    Pod::UI.puts "[StripeTerminal] Using public iOS SDK package from #{public_spm_url}"
  end

  StripeTerminalSPMEmbedding.register(
    pod_name: s.name,
    url: spm_url,
    requirement: spm_requirement,
    products: spm_products
  )
  install_modules_dependencies(s)
end

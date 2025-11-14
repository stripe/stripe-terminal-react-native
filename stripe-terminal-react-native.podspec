require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'stripe-terminal-react-native'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { ios: '15.1' }
  s.source       = { git: 'https://github.com/stripe/stripe-terminal-react-native.git', tag: s.version.to_s }

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.exclude_files = 'ios/Tests/'
  s.xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => 'SCP_USB_ENABLED=1' }
  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'ios/Tests/**/*.{m,swift}'
  end

  s.dependency 'React-Core'
  s.dependency 'StripeTerminal', '~> 4.7.3'
  install_modules_dependencies(s)
end

require 'pathname'

# Xcode processes a Swift package binary into each consumer's build directory and
# archives one signature per copy. CocoaPods builds each pod into its own
# subdirectory, so a pod consumer next to the app duplicates the signature and
# fails archives (https://github.com/CocoaPods/CocoaPods/issues/12022).
#
# Registered from the podspec, this helper extends React Native's SPM post-install
# hook and adds each package product only to the targets that build into the
# shared PODS_CONFIGURATION_BUILD_DIR: every user target that includes the SDK,
# which also embeds the dynamic products, and the SDK's own test targets, which
# build the pod without an app. The pod compiles against the copy processed there.
# It supports both the public remote package and the local prerelease package.
module StripeTerminalSPMEmbedding
  @dependencies = []
  @hook_installed = false

  # Run React Native's SPM setup first, then add the package to its consumers.
  module PostInstallHook
    def apply_on_post_install(installer)
      super
      StripeTerminalSPMEmbedding.apply_on_post_install(installer)
    end
  end

  class << self
    # Called by the podspec while CocoaPods evaluates the SDK dependency.
    def register(pod_name:, url:, requirement:, products:)
      dependency = {
        pod_name: pod_name,
        url: url,
        requirement: requirement,
        products: products,
      }
      @dependencies << dependency unless @dependencies.include?(dependency)
      install_hook
    end

    def apply_on_post_install(installer)
      projects_to_save = {}

      @dependencies.each do |dependency|
        installer.aggregate_targets.each do |aggregate_target|
          next unless aggregate_target.pod_targets.any? { |target| target.pod_name == dependency[:pod_name] }
          next unless aggregate_target.user_project

          project = aggregate_target.user_project
          package = add_package_reference(project, dependency)

          aggregate_target.user_targets.each do |target|
            dependency[:products].each do |product_name|
              add_product_dependency(project, target, package, product_name)
            end
          end

          projects_to_save[project.path.to_s] = project
        end

        add_to_test_targets(installer, dependency)
      end

      projects_to_save.each_value(&:save)
    end

    private

    # CocoaPods saves the Pods project after the post-install hooks run.
    def add_to_test_targets(installer, dependency)
      result = installer.target_installation_results.pod_target_installation_results[dependency[:pod_name]]
      return unless result && result.test_native_targets.any?

      project = installer.pods_project
      package = add_package_reference(project, dependency)
      result.test_native_targets.each do |target|
        dependency[:products].each do |product_name|
          add_product_dependency(project, target, package, product_name)
        end
      end
    end

    def install_hook
      return if @hook_installed

      unless defined?(SPM) && SPM.respond_to?(:apply_on_post_install)
        raise 'Stripe Terminal requires React Native 0.83 or newer for Swift Package Manager support.'
      end

      SPM.singleton_class.prepend(PostInstallHook)
      @hook_installed = true
    end

    def add_package_reference(project, dependency)
      if File.exist?(File.join(dependency[:url], 'Package.swift'))
        package_class = Xcodeproj::Project::Object::XCLocalSwiftPackageReference
        package_path = Pathname.new(dependency[:url])
          .relative_path_from(Pathname.new(project.path.dirname))
          .to_s
        package = project.root_object.package_references.find do |reference|
          reference.is_a?(package_class) && reference.relative_path == package_path
        end

        return package if package

        package = project.new(package_class)
        package.relative_path = package_path
        project.root_object.package_references << package
        package
      else
        package_class = Xcodeproj::Project::Object::XCRemoteSwiftPackageReference
        package = project.root_object.package_references.find do |reference|
          reference.is_a?(package_class) && reference.repositoryURL == dependency[:url]
        end

        if package
          package.requirement = dependency[:requirement]
          return package
        end

        package = project.new(package_class)
        package.repositoryURL = dependency[:url]
        package.requirement = dependency[:requirement]
        project.root_object.package_references << package
        package
      end
    end

    def add_product_dependency(project, target, package, product_name)
      product_class = Xcodeproj::Project::Object::XCSwiftPackageProductDependency
      matching_products = target.package_product_dependencies.select do |dependency|
        dependency.is_a?(product_class) && dependency.product_name == product_name
      end
      product = matching_products.find { |dependency| dependency.package == package } || matching_products.first
      stale_packages = matching_products.map(&:package).compact.reject { |reference| reference == package }

      if product
        product.package = package
      else
        product = project.new(product_class)
        product.package = package
        product.product_name = product_name
        target.package_product_dependencies << product
      end

      (matching_products - [product]).each do |duplicate|
        target.frameworks_build_phase.files
          .select { |file| file.product_ref == duplicate }
          .each(&:remove_from_project)
        duplicate.remove_from_project
      end

      unless target.frameworks_build_phase.files.any? { |file| file.product_ref == product }
        build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
        build_file.product_ref = product
        target.frameworks_build_phase.files << build_file
      end

      stale_packages.each { |reference| remove_package_reference_if_unused(project, reference) }
    end

    def remove_package_reference_if_unused(project, package)
      product_class = Xcodeproj::Project::Object::XCSwiftPackageProductDependency
      return if project.objects.any? do |object|
        object.is_a?(product_class) && object.package == package
      end

      project.root_object.package_references.delete(package)
      package.remove_from_project
    end
  end
end

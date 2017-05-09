easy_extensions = Redmine::Plugin.installed?(:easy_extensions)
app_dir = File.join(File.dirname(__FILE__), 'app')
lib_dir = File.join(File.dirname(__FILE__), 'lib', 'easy_gantt')

# Redmine patches
patch_path = File.join(lib_dir, 'redmine_patch', '**', '*.rb')
Dir.glob(patch_path).each do |file|
  require file
end

ActiveSupport::Dependencies.autoload_paths << File.join(app_dir, 'models', 'queries')

if easy_extensions
  ActiveSupport::Dependencies.autoload_paths << File.join(app_dir, 'models', 'easy_queries')
  EasyQuery.register(EasyGanttEasyIssueQuery)
end

# this block is called every time rails are reloading code
# in development it means after each change in observed file
# in production it means once just after server has started
# in this block should be used require_dependency, but only if necessary.
# better is to place a class in file named by rails naming convency and let it be loaded automatically
# Here goes query registering, custom fields registering and so on
ActionDispatch::Reloader.to_prepare do
  require 'easy_gantt/easy_gantt'
  require 'easy_gantt/hooks'

  RedmineExtensions::EasySettingPresenter.boolean_keys << :easy_gantt_show_holidays << :easy_gantt_show_project_progress << :easy_gantt_show_lowest_progress_tasks << :keep_link_delay_in_drag << :easy_gantt_show_task_soonest_start
end


Redmine::MenuManager.map :top_menu do |menu|
  menu.push(:easy_gantt, { controller: 'easy_gantt', action: 'index', set_filter: 0 },
    caption: :label_easy_gantt,
    after: :documents,
    html: { class: 'icon icon-stats' },
    if: proc { User.current.allowed_to_globally?(:view_global_easy_gantt) })
end

Redmine::MenuManager.map :project_menu do |menu|
  menu.push(:easy_gantt, { controller: 'easy_gantt', action: 'index' },
    param: :project_id,
    caption: :button_project_menu_easy_gantt,
    if: proc { |p| User.current.allowed_to?(:view_easy_gantt, p) })
end

Redmine::MenuManager.map :easy_gantt do |menu|
  menu.push(:task_control, 'javascript:void(0)',
    param: :project_id,
    caption: :button_edit,
    html: { icon: 'icon-edit' })

  menu.push(:tool_panel, 'javascript:void(0)',
    param: :project_id,
    caption: :'easy_gantt.button.tool_panel',
    html: { icon: 'icon-star' })

  menu.push(:add_task, 'javascript:void(0)',
    param: :project_id,
    caption: :label_new,
    html: { trial: true, icon: 'icon-add' },
    if: proc { |p| p.present? })

  menu.push(:resource, proc { |project| defined?(EasyUserAllocations) ? { controller: 'user_allocation_gantt', project_id: project } : nil },
    param: :project_id,
    caption: :'easy_gantt.button.resource_management',
    html: { trial: true, icon: 'icon-stats', easy_text: defined?(EasyExtensions) },
    if: proc { |p| p.present? })

  menu.push(:critical, 'javascript:void(0)',
    param: :project_id,
    caption: :'easy_gantt.button.critical_path',
    html: { trial: true, icon: 'icon-summary' },
    if: proc { |p| p.present? })

  menu.push(:baseline, 'javascript:void(0)',
    param: :project_id,
    caption: :'easy_gantt.button.create_baseline',
    html: { trial: true, icon: 'icon-projects icon-project' },
    if: proc { |p| p.present? })

  menu.push(:problem_finder, 'javascript:void(0)',
    caption: :'easy_gantt.button.problem_finder')

  menu.push(:back, 'javascript:void(0)',
    param: :project_id,
    caption: :button_back,
    html: { icon: 'icon-back' })

  menu.push(:save, 'javascript:void(0)',
    param: :project_id,
    caption: :button_save,
    html: { no_button: true, class: 'button-positive button-1' })
end


# this block is executed once just after Redmine is started
# means after all plugins are initialized
# it is place for plain requires, not require_dependency
# it should contain hooks, permissions - base class in Redmine is required thus is not reloaded
ActiveSupport.on_load(:easyproject, yield: true) do

  if easy_extensions
    Redmine::MenuManager.map :projects_easy_page_layout_service_box do |menu|
      menu.push(:project_easy_gantt, :easy_gantt_path,
        caption: :label_easy_gantt,
        html: { class: 'icon icon-stats button button-2' },
        if: proc { User.current.allowed_to_globally?(:view_global_easy_gantt) })
    end

    Redmine::MenuManager.map :easy_quick_top_menu do |menu|
      menu.push(:project_easy_gantt, { controller: 'easy_gantt', action: 'index', id: nil, set_filter: 0 },
        caption: :label_easy_gantt,
        parent: :projects,
        html: { class: 'icon icon-stats' },
        if: proc { User.current.allowed_to_globally?(:view_global_easy_gantt) })

      menu.push(:issues_easy_gantt, { controller: 'easy_gantt', action: 'index', id: nil, set_filter: 0 },
        caption: :label_easy_gantt,
        parent: :issues,
        html: { class: 'icon icon-stats project-gantt' },
        if: proc { User.current.allowed_to_globally?(:view_global_easy_gantt) })
    end
  end

end


Redmine::AccessControl.map do |map|
  map.project_module :easy_gantt do |pmap|
    # View project level
    pmap.permission(:view_easy_gantt, {
      easy_gantt: [:index, :issues, :projects],
      easy_gantt_pro: [:lowest_progress_tasks],
      easy_gantt_resources: [:index, :project_data, :users_sums, :projects_sums, :allocated_issues]
    }, read: true, require: :member)

    # Edit project level
    pmap.permission(:edit_easy_gantt, {
      easy_gantt: [:change_issue_relation_delay, :reschedule_project],
      easy_gantt_resources: [:index, :project_data, :bulk_update_or_create, :users_sums, :projects_sums]
    }, require: :member)

    # View global level
    pmap.permission(:view_global_easy_gantt, {
      easy_gantt: [:index, :issues, :projects, :project_issues],
      easy_gantt_pro: [:lowest_progress_tasks],
      easy_gantt_resources: [:index, :project_data, :global_data, :projects_sums, :allocated_issues]
    }, global: true, read: true, require: :loggedin)

    # Edit global level
    pmap.permission(:edit_global_easy_gantt, {
      easy_gantt_resources: [:index, :project_data, :global_data, :bulk_update_or_create, :users_sums, :projects_sums]
    }, global: true, require: :loggedin)

    # View personal level
    pmap.permission(:view_personal_easy_gantt, {
      easy_gantt_resources: [:global_data]
    }, global: true, read: true, require: :loggedin)

    # Edit personal level
    pmap.permission(:edit_personal_easy_gantt, {
      easy_gantt_resources: [:global_data, :users_sums, :projects_sums, :bulk_update_or_create]
    }, global: true, require: :loggedin)
  end
end

begin
  if ActiveRecord::Base.connection.table_exists?(:settings)
    Setting.where(name: 'rest_api_enabled').update_all(value: '1')
  end
rescue
  # Do nothing for cleanup installation & tests
end


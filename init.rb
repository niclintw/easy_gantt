Redmine::Plugin.register :easy_gantt do
  name 'Easy Gantt plugin'
  author 'Easy Software Ltd'
  description 'Cool gantt for redmine'
  version '1.7'
  url 'www.easyredmine.com'
  author_url 'www.easysoftware.cz'

  settings partial: 'easy_gantt_nil', only_easy: true, easy_settings: {
    show_holidays: false,
    show_project_progress: true,
    critical_path: 'last',
    default_zoom: 'day',
    show_lowest_progress_tasks: false,
    keep_link_delay_in_drag: false,
    show_task_soonest_start: false
  }
end

easy_extensions = Redmine::Plugin.registered_plugins[:easy_extensions]
if easy_extensions.nil? || Gem::Version.new(easy_extensions.version) < Gem::Version.new('2016.03.00')
  require_relative 'after_init'
end

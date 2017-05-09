module EasyGantt
  class Hooks < Redmine::Hook::ViewListener

    render_on :view_easy_gantt_tools, partial: 'easy_gantt/gantt_tools'

    def helper_options_for_default_project_page(context={})
      context[:default_pages] << 'easy_gantt' if context[:enabled_modules].include?('easy_gantt')
    end

  end
end

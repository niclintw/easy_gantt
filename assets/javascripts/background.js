window.ysy = window.ysy || {};
ysy.view = ysy.view || {};
ysy.view.getGanttBackground = function () {
  var redmineStyles = {
    weekend: "rgba(238,238,238,1)",
    selected: "rgba(255,236,110,0.25)",
    selected_weekend: "rgba(255,236,110,0.25)",
    line: "rgba(200,200,200,0.5)",
    line_selected: "#ffec6e",
    line_month: "#628DB6",
    assignee: "rgba(62,91,118,0.1)",
    darkLimits: "rgba(62,91,118,0.3)"
  };
  var easyRedmineStyles = {
    weekend: "#eeeeee",
    selected: "#ffec6e",
    selected_weekend: "#F4E88A",
    line: "#ebebeb",
    line_selected: "#ffec6e",
    line_month: "#aaaaff",
    assignee: "#bbbbbb",
    darkLimits: "rgba(62,91,118,0.3)"
  };
  if (ysy.settings.easyRedmine) {
    var colors = easyRedmineStyles;
  } else {
    colors = redmineStyles;
  }
  return {
    fullCanvasRender: false,
    container: gantt.$task_bg,
    renderer: true,
    LIMIT: 8170,
    filter: gantt._create_filter(['_filter_task', '_is_chart_visible', '_is_std_background']),
    lastCounts: {},
    lastItems: null,
    lastPos: null,
    _render_bg_canvas: function (canvas, items, limits) {
      var rowHeight = gantt.config.row_height;
      var cfg = gantt._tasks;
      var widths = cfg.width;
      var fullHeight = rowHeight * (limits.toY - limits.fromY);
      var fullWidth = 0;
      var needClear = true;
      var width;
      var partWidth;
      var context = canvas.getContext('2d');
      for (var i = limits.fromX; i < limits.toX; i++) {
        fullWidth += widths[i];
      }
      if (canvas.height !== fullHeight) {
        canvas.style.height = fullHeight + "px";
        canvas.height = fullHeight;
        needClear = false;
      }
      if (canvas.width !== fullWidth) {
        canvas.style.width = fullWidth + "px";
        canvas.width = fullWidth;
        needClear = false;
      }
      canvas.style.left = cfg.left[limits.fromX] + "px";
      canvas.style.top = rowHeight * limits.fromY + "px";
      //  -- CLEARING --
      if (needClear) {
        context.clearRect(0, 0, fullWidth, fullHeight);
      }
      //  -- WEEKENDS BACKGROUND --
      if (gantt.config.scale_unit === "day") {
        partWidth = 0;
        context.fillStyle = colors.weekend;
        for (i = limits.fromX; i < limits.toX; i++) {
          width = widths[i];
          if (cfg.weekends[i]) {
            context.fillRect(partWidth, 0, width, fullHeight);
          }
          partWidth += width;
        }
      }
      //  -- HORIZONTAL LINES --
      context.strokeStyle = colors.line;
      context.beginPath();
      for (i = 1; i <= limits.toY - limits.fromY; i++) {
        context.moveTo(0, i * rowHeight - 0.5);
        context.lineTo(fullWidth, i * rowHeight - 0.5);
      }
      //  -- VERTICAL LINES --
      partWidth = -0.5;
      for (i = limits.fromX; i < limits.toX; i++) {
        width = widths[i];
        if (width <= 0) continue; //do not render skipped columns
        partWidth += width;
        context.moveTo(partWidth, 0);
        context.lineTo(partWidth, fullHeight);
      }
      context.stroke();
      //  -- SELECTED --
      for (i = limits.fromY; i < limits.toY; i++) {
        if (gantt.getState().selected_task == items[i].id) {
          break;
        }
      }
      if (i < limits.toY) {
        //  -- SELECTED ROW --
        context.fillStyle = colors.selected;
        context.fillRect(0, (i - limits.fromY) * rowHeight, fullWidth, rowHeight);

        //  -- SELECTED WEEKENDS --
        if (gantt.config.scale_unit === "day") {
          partWidth = 0;
          context.fillStyle = colors.selected_weekend;
          for (var j = limits.fromX; j < limits.toX; j++) {
            width = widths[j];
            if (cfg.weekends[j]) {
              context.fillRect(partWidth, (i - limits.fromY) * rowHeight, width, rowHeight);
            }
            partWidth += width;
          }
        }
      }
      if (ysy.settings.resource.open) {
        //  -- ASSIGNEE BACKGROUND --
        context.globalAlpha = 0.5;
        context.fillStyle = colors.assignee;
        for (i = limits.fromY; i < limits.toY; i++) {
          if (items[i].type === "assignee") {
            context.fillRect(0, (i - limits.fromY) * rowHeight, fullWidth, rowHeight);
          }
        }
        //  -- DARK LIMITS --
        context.fillStyle = colors.darkLimits;
        var ganttLimits = ysy.data.limits;
        if (ganttLimits.start_date) {
          var left = gantt.posFromDate(ganttLimits.start_date) - gantt.posFromDate(cfg.trace_x[limits.fromX]);
          if (left > 0) {
            context.fillRect(0, 0, left, fullHeight);
          }
        }
        if (ganttLimits.end_date) {
          var right = gantt.posFromDate(ganttLimits.end_date) - gantt.posFromDate(cfg.trace_x[limits.fromX]);
          if (right > 0) {
            context.fillRect(right, 0, fullWidth - right, fullHeight);
          }
        }
        context.globalAlpha = 1;
      }
      //  -- BLUE LINE --
      if (gantt.config.scale_unit === "day") {
        partWidth = 0.5;
        context.strokeStyle = colors.line_month;
        context.beginPath();
        for (i = limits.fromX; i < limits.toX; i++) {
          width = cfg.width[i];
          var first = moment(cfg.trace_x[i]).date() === 1;
          if (first) {
            context.moveTo(partWidth, 0);
            context.lineTo(partWidth, fullHeight);
          }
          partWidth += width;
        }
        context.stroke();
      }
    },
    render_bg_line: function (canvas, index, item) {

    },
    render_item: function (item, container) {
      ysy.log.debug("render_item BG", "canvas_bg");
    },
    render_items: function (items, container) {
      ysy.log.debug("render_items FULL BG", "canvas_bg");
      container = container || this.node;
      if (items) {
        this.lastItems = items;
      } else {
        items = this.lastItems;
        if (!items) return;
      }
      if (this.fullCanvasRender) {
        this.render_all_canvases(items, container);
      } else {
        this.render_one_canvas(items, container);
      }

      var fullHeight = gantt.config.row_height * items.length;
      container.style.height = fullHeight + "px";
      var lastEvent;
      $(container)
          .off("mousedown.bg")
          .on("mousedown.bg", function (e) {
            lastEvent = e;
          })
          .off("click.bg")
          .on("click.bg", function (e) {
            if (!lastEvent) return;
            if (Math.abs(lastEvent.pageX - e.pageX) > 2 || Math.abs(lastEvent.pageY - e.pageY) > 2) return;
            var order = gantt._order;
            var offsetTop = $(container).offset().top;
            var index = Math.floor((e.pageY - offsetTop) / gantt.config.row_height);
            if (index < 0 || index >= order.length) return;
            var taskId = order[index];
            if (!gantt.isTaskExists(taskId)) return;
            if (gantt._selected_task == taskId) {
              gantt.unselectTask();
            } else {
              gantt.selectTask(taskId);
            }
          })
    },
    render_one_canvas: function (items, container) {
      var cfg = gantt._tasks;
      if (this.forceRender === false) return;
      var scrollPos = gantt.getCachedScroll();
      // var nodeWidth = this.node.innerWidth;
      // if(scrollPos.x > Math.max(nodeWidth - window.innerWidth, 0)){
      //   scrollPos.x = gantt.$task.scrollLeft;
      // }
      this.lastPos = scrollPos;
      //ysy.log.debug("render_one_canvas ["+scrollPos.x+","+scrollPos.y+"]","canvas_bg");
      var rowHeight = gantt.config.row_height;
      var colWidth = cfg.col_width;
      var countX = cfg.count;
      var countY = items.length;
      //var fullHeight = rowHeight * countY;
      var limits = this.getCanvasLimits();
      var partCountX = Math.ceil(limits.x / colWidth),
          partCountY = Math.ceil(limits.y / rowHeight);
      var startX = Math.max(scrollPos.x - (limits.x - window.innerWidth) / 2, 0);
      var startY = Math.max(scrollPos.y - (limits.y - window.innerHeight) / 2, 0);
      var startCountX = Math.floor(startX / colWidth);
      var startCountY = Math.floor(startY / rowHeight);
      if (startCountX + partCountX > countX) {
        startCountX = countX - partCountX;
      }
      if (startCountY + partCountY > countY) {
        startCountY = countY - partCountY;
      }
      var canvas = this.canvas;
      if (canvas === undefined) {
        canvas = document.createElement("canvas");
        $(canvas).css({position: "absolute"});
        this.canvas = canvas;
        container.appendChild(canvas);
      }
      this._render_bg_canvas(canvas, items, {
        fromX: Math.max(startCountX, 0),
        toX: startCountX + partCountX,
        fromY: Math.max(startCountY, 0),
        toY: startCountY + partCountY
      });
    },
    render_all_canvases: function (items, container) {
      var y, x;
      ysy.log.debug("render_items FULL BG", "canvas_bg");
      if (!this.rendered.length)this.rendered = [];
      var cfg = gantt._tasks;
      var rowHeight = gantt.config.row_height;
      var colWidth = cfg.col_width;
      var countX = cfg.count;
      var countY = items.length;
      //var fullHeight = rowHeight * countY;
      var partCountY = Math.ceil(this.LIMIT / rowHeight),
          partCountX = Math.ceil(this.LIMIT / colWidth);
      var nCanvasX = Math.ceil(countX / partCountX);
      var nCanvasY = Math.ceil(countY / partCountY);
      if (this.lastCounts.nCanvasY > nCanvasY) {
        for (y = 0; y < this.lastCounts.nCanvasY - nCanvasY; y++) {
          var removed = this.rendered.pop();
          for (x = 0; x < removed.length; x++) {
            container.removeChild(removed[x]);
          }
        }
      }
      if (this.lastCounts.nCanvasX > nCanvasX) {
        var diff = this.lastCounts.nCanvasX - nCanvasX;
        for (y = 0; y < this.rendered.length; y++) {
          for (x = 0; x < diff; x++) {
            removed = this.rendered[y].pop();
            container.removeChild(removed);
          }
        }
      }
      this.lastCounts = {nCanvasX: nCanvasX, nCanvasY: nCanvasY};
      //var fullWidth = cfg.full_width;
      var lastElement;
      for (y = 0; y < nCanvasY; y++) {
        if (!this.rendered[y]) this.rendered.push([]);
        for (x = 0; x < nCanvasX; x++) {
          var canvas = this.rendered[y][x];
          if (canvas === undefined) {
            canvas = document.createElement("canvas");
            if (lastElement && lastElement.nextSibling) {
              container.insertBefore(canvas, lastElement.nextSibling);
            } else {
              container.appendChild(canvas);
            }
            canvas.style.float = "left";
            this.rendered[y].push(canvas);
          }
          this._render_bg_canvas(canvas, items, {
            fromX: x * partCountX,
            toX: Math.min((x + 1) * partCountX, countX),
            fromY: y * partCountY,
            toY: Math.min((y + 1) * partCountY, countY)
          });
          lastElement = canvas;
        }
      }
    },
    switchFullRender: function (fullRender) {
      if (this.fullCanvasRender === fullRender) return;
      if (this.fullCanvasRender) {
        this.lastCounts = {};
        for (var y = 0; y < this.rendered.length; y++) {
          var removed = this.rendered.pop();
          for (var x = 0; x < removed.length; x++) {
            this.node.removeChild(removed[x]);
          }
        }
      } else {
        if (this.canvas) {
          this.node.removeChild(this.canvas);
          delete this.canvas;
        }
      }
      this.fullCanvasRender = fullRender;
      this.render_items();
    },
    isScrolledOut: function (x, y) {
      if (this.fullCanvasRender) return;
      if (this.forceRender) return true;
      var lastPos = this.lastPos;
      if (!lastPos) return true;
      var limits = this.getCanvasLimits();
      if (x !== undefined) {
        var bufferX = (limits.x - window.innerWidth) / 2;
        if (Math.abs(x - lastPos.x) > bufferX) return true;
      }
      if (y !== undefined) {
        var bufferY = (limits.y - window.innerHeight) / 2;
        if (Math.abs(y - lastPos.y) > bufferY) return true;
      }
    },
    getCanvasLimits: function () {
      var result = {x: window.innerWidth + 600, y: window.innerHeight + 600};
      if (result.x > this.LIMIT) {
        result.x = this.LIMIT;
      }
      if (result.y > this.LIMIT) {
        result.y = this.LIMIT;
      }
      return result;
    }
  };
};
